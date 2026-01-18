// vite.config.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { componentTagger } from 'lovable-tagger';
import path from "path";

import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';


// CJS/ESM interop for Babel libs
const traverse: typeof _traverse.default = ((_traverse as any).default ?? _traverse) as any;
const generate: typeof _generate.default = ((_generate as any).default ?? _generate) as any;

function cdnPrefixImages(): Plugin {
  const DEBUG = process.env.CDN_IMG_DEBUG === '1';
  let publicDir = '';              // absolute path to Vite public dir
  const imageSet = new Set<string>(); // stores normalized '/images/...' paths

  const isAbsolute = (p: string) =>
    /^(?:[a-z]+:)?\/\//i.test(p) || p.startsWith('data:') || p.startsWith('blob:');

  // normalize a ref like './images/x.png', '../images/x.png', '/images/x.png' -> '/images/x.png'
  const normalizeRef = (p: string) => {
    let s = p.trim();
    // quick bail-outs
    if (isAbsolute(s)) return s;
    // strip leading ./ and any ../ segments (we treat public/ as root at runtime)
    s = s.replace(/^(\.\/)+/, '');
    while (s.startsWith('../')) s = s.slice(3);
    if (s.startsWith('/')) s = s.slice(1);
    // ensure it starts with images/
    if (!s.startsWith('images/')) return p; // not under images → leave as is
    return '/' + s; // canonical: '/images/...'
  };

  const toCDN = (p: string, cdn: string) => {
    const n = normalizeRef(p);
    if (isAbsolute(n)) return n;
    if (!n.startsWith('/images/')) return p;           // not our folder
    if (!imageSet.has(n)) return p;                    // not an existing file
    const base = cdn.endsWith('/') ? cdn : cdn + '/';
    return base + n.slice(1);                          // 'https://cdn/.../images/..'
  };

  const rewriteSrcsetList = (value: string, cdn: string) =>
    value
      .split(',')
      .map((part) => {
        const [url, desc] = part.trim().split(/\s+/, 2);
        const out = toCDN(url, cdn);
        return desc ? `${out} ${desc}` : out;
      })
      .join(', ');

  const rewriteHtml = (html: string, cdn: string) => {
    // src / href
    html = html.replace(
      /(src|href)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, p) => `${k}=${q}${toCDN(p, cdn)}${q}`
    );
    // srcset
    html = html.replace(
      /(srcset)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, list) => `${k}=${q}${rewriteSrcsetList(list, cdn)}${q}`
    );
    return html;
  };

  const rewriteCssUrls = (code: string, cdn: string) =>
    code.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q, p) => `url(${q}${toCDN(p, cdn)}${q})`);

  const rewriteJsxAst = (code: string, id: string, cdn: string) => {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    let rewrites = 0;

    traverse(ast, {
      JSXAttribute(path) {
        const name = (path.node.name as t.JSXIdentifier).name;
        const isSrc = name === 'src' || name === 'href';
        const isSrcSet = name === 'srcSet' || name === 'srcset';
        if (!isSrc && !isSrcSet) return;

        const val = path.node.value;
        if (!val) return;

        if (t.isStringLiteral(val)) {
          const before = val.value;
          val.value = isSrc ? toCDN(val.value, cdn) : rewriteSrcsetList(val.value, cdn);
          if (val.value !== before) rewrites++;
          return;
        }
        if (t.isJSXExpressionContainer(val) && t.isStringLiteral(val.expression)) {
          const before = val.expression.value;
          val.expression.value = isSrc
            ? toCDN(val.expression.value, cdn)
            : rewriteSrcsetList(val.expression.value, cdn);
          if (val.expression.value !== before) rewrites++;
        }
      },

      StringLiteral(path) {
        // skip object keys: { "image": "..." }
        if (t.isObjectProperty(path.parent) && path.parentKey === 'key' && !path.parent.computed) return;
        // skip import/export sources
        if (t.isImportDeclaration(path.parent) || t.isExportAllDeclaration(path.parent) || t.isExportNamedDeclaration(path.parent)) return;
        // skip inside JSX attribute (already handled)
        if (path.findParent(p => p.isJSXAttribute())) return;

        const before = path.node.value;
        const after = toCDN(before, cdn);
        if (after !== before) { path.node.value = after; rewrites++; }
      },

      TemplateLiteral(path) {
        // handle `"/images/foo.png"` as template with NO expressions
        if (path.node.expressions.length) return;
        const raw = path.node.quasis.map(q => q.value.cooked ?? q.value.raw).join('');
        const after = toCDN(raw, cdn);
        if (after !== raw) {
          path.replaceWith(t.stringLiteral(after));
          rewrites++;
        }
      },

    });

    if (!rewrites) return null;
    const out = generate(ast, { retainLines: true, sourceMaps: false }, code).code;
    if (DEBUG) console.log(`[cdn] ${id} → ${rewrites} rewrites`);
    return out;
  };

  async function collectPublicImagesFrom(dir: string) {
    // Recursively collect every file under public/images into imageSet as '/images/relpath'
    const imagesDir = nodePath.join(dir, 'images');
    const stack = [imagesDir];
    while (stack.length) {
      const cur = stack.pop()!;
      let entries: any[] = [];
      try {
        entries = await fs.readdir(cur, { withFileTypes: true });
      } catch {
        continue; // images/ may not exist
      }
      for (const ent of entries) {
        const full = nodePath.join(cur, ent.name);
        if (ent.isDirectory()) {
          stack.push(full);
        } else if (ent.isFile()) {
          const rel = nodePath.relative(dir, full).split(nodePath.sep).join('/');
          const canonical = '/' + rel; // '/images/...'
          imageSet.add(canonical);
          // also add variant without leading slash for safety
          imageSet.add(canonical.slice(1)); // 'images/...'
        }
      }
    }
  }

  return {
    name: 'cdn-prefix-images-existing',
    apply: 'build',
    enforce: 'pre', // run before @vitejs/plugin-react

    configResolved(cfg) {
      publicDir = cfg.publicDir; // absolute
      if (DEBUG) console.log('[cdn] publicDir =', publicDir);
    },

    async buildStart() {
      await collectPublicImagesFrom(publicDir);
      if (DEBUG) console.log('[cdn] images found:', imageSet.size);
    },

    transformIndexHtml(html) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return html;
      const out = rewriteHtml(html, cdn);
      if (DEBUG) console.log('[cdn] transformIndexHtml done');
      return out;
    },

    transform(code, id) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return null;

      if (/\.(jsx|tsx)$/.test(id)) {
        const out = rewriteJsxAst(code, id, cdn);
        return out ? { code: out, map: null } : null;
      }

      if (/\.(css|scss|sass|less|styl)$/i.test(id)) {
        const out = rewriteCssUrls(code, cdn);
        return out === code ? null : { code: out, map: null };
      }

      return null;
    },
  };
}

function cssInliner(): Plugin {
  return {
    name: 'vite-css-inliner',
    apply: 'build',
    enforce: 'post',
    generateBundle(opts, bundle) {
      const htmlFile = Object.values(bundle).find(
        (file) => file.fileName === 'index.html' && file.type === 'asset'
      ) as any;

      if (!htmlFile) return;

      // Find CSS files referenced in the HTML
      // Note: Vite injects <link rel="stylesheet" href="/assets/index-....css">
      const cssLinkRegex = /<link[^>]*href="([^"]+\.css)"[^>]*>/g;
      const linkedCssFiles: string[] = [];
      let match;

      while ((match = cssLinkRegex.exec(htmlFile.source)) !== null) {
        // match[1] will be like "/assets/index-C1234.css" or "./assets/.."
        // We need to map this back to the bundle key.
        // Bundle keys are typically "assets/index-C1234.css" (no leading slash or dot)
        const href = match[1];
        const bundleKey = href.replace(/^(\.\/|\/)/, '');
        linkedCssFiles.push(bundleKey);
      }

      let cssContent = '';
      const removedFiles: string[] = [];

      // Only inline the files actually linked in index.html (Critical CSS)
      for (const file of linkedCssFiles) {
        if (bundle[file]) {
          const cssAsset = bundle[file] as any;
          cssContent += cssAsset.source;
          delete bundle[file];
          removedFiles.push(file);
        }
      }

      if (cssContent) {
        // Define a function to escape regex special characters
        const escapeRegExp = (string: string) => {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        // Remove <link> tags for inlined files
        for (const file of removedFiles) {
          // We need to be careful to match the specific href that was found earlier
          // The simplest way might be to regex match the filename portion
          const filename = path.basename(file);
          const reg = new RegExp(`<link[^>]*href="[^"]*${escapeRegExp(filename)}"[^>]*>`, 'g');
          htmlFile.source = htmlFile.source.replace(reg, '');
        }

        // Inject inlined CSS
        htmlFile.source = htmlFile.source.replace(
          '</head>',
          `<style>${cssContent}</style></head>`
        );

        console.log(`[css-inliner] Inlined ${cssContent.length} bytes of CSS from ${removedFiles.join(', ')}`);
      } else {
        console.log('[css-inliner] No linked CSS files found to inline.');
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
      cdnPrefixImages(),
      cssInliner(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Proxy react-router-dom to our wrapper
        "react-router-dom": path.resolve(__dirname, "./src/lib/react-router-dom-proxy.tsx"),
        // Original react-router-dom under a different name
        "react-router-dom-original": "react-router-dom",
      },
    },
    define: {
      // Define environment variables for build-time configuration
      // In production, this will be false by default unless explicitly set to 'true'
      // In development and test, this will be true by default
      __ROUTE_MESSAGING_ENABLED__: JSON.stringify(
        mode === 'production'
          ? process.env.VITE_ENABLE_ROUTE_MESSAGING === 'true'
          : process.env.VITE_ENABLE_ROUTE_MESSAGING !== 'false'
      ),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'ui-core': ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
            'animation': ['framer-motion'],
            'charts': ['recharts'],
            'date-fns': ['date-fns'],
          }
        }
      }
    }
  }
});
