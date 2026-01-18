// vite.config.ts
import { defineConfig } from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/@vitejs/plugin-react-swc/index.js";
import fs from "node:fs/promises";
import nodePath from "node:path";
import { componentTagger } from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/lovable-tagger/dist/index.js";
import path from "path";
import { parse } from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/@babel/parser/lib/index.js";
import _traverse from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/@babel/traverse/lib/index.js";
import _generate from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/@babel/generator/lib/index.js";
import * as t from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/@babel/types/lib/index.js";
var __vite_injected_original_dirname = "C:\\Users\\munch\\Desktop\\cozinha-ao-lucro";
var traverse = _traverse.default ?? _traverse;
var generate = _generate.default ?? _generate;
function cdnPrefixImages() {
  const DEBUG = process.env.CDN_IMG_DEBUG === "1";
  let publicDir = "";
  const imageSet = /* @__PURE__ */ new Set();
  const isAbsolute = (p) => /^(?:[a-z]+:)?\/\//i.test(p) || p.startsWith("data:") || p.startsWith("blob:");
  const normalizeRef = (p) => {
    let s = p.trim();
    if (isAbsolute(s)) return s;
    s = s.replace(/^(\.\/)+/, "");
    while (s.startsWith("../")) s = s.slice(3);
    if (s.startsWith("/")) s = s.slice(1);
    if (!s.startsWith("images/")) return p;
    return "/" + s;
  };
  const toCDN = (p, cdn) => {
    const n = normalizeRef(p);
    if (isAbsolute(n)) return n;
    if (!n.startsWith("/images/")) return p;
    if (!imageSet.has(n)) return p;
    const base = cdn.endsWith("/") ? cdn : cdn + "/";
    return base + n.slice(1);
  };
  const rewriteSrcsetList = (value, cdn) => value.split(",").map((part) => {
    const [url, desc] = part.trim().split(/\s+/, 2);
    const out = toCDN(url, cdn);
    return desc ? `${out} ${desc}` : out;
  }).join(", ");
  const rewriteHtml = (html, cdn) => {
    html = html.replace(
      /(src|href)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, p) => `${k}=${q}${toCDN(p, cdn)}${q}`
    );
    html = html.replace(
      /(srcset)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, list) => `${k}=${q}${rewriteSrcsetList(list, cdn)}${q}`
    );
    return html;
  };
  const rewriteCssUrls = (code, cdn) => code.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q, p) => `url(${q}${toCDN(p, cdn)}${q})`);
  const rewriteJsxAst = (code, id, cdn) => {
    const ast = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] });
    let rewrites = 0;
    traverse(ast, {
      JSXAttribute(path2) {
        const name = path2.node.name.name;
        const isSrc = name === "src" || name === "href";
        const isSrcSet = name === "srcSet" || name === "srcset";
        if (!isSrc && !isSrcSet) return;
        const val = path2.node.value;
        if (!val) return;
        if (t.isStringLiteral(val)) {
          const before = val.value;
          val.value = isSrc ? toCDN(val.value, cdn) : rewriteSrcsetList(val.value, cdn);
          if (val.value !== before) rewrites++;
          return;
        }
        if (t.isJSXExpressionContainer(val) && t.isStringLiteral(val.expression)) {
          const before = val.expression.value;
          val.expression.value = isSrc ? toCDN(val.expression.value, cdn) : rewriteSrcsetList(val.expression.value, cdn);
          if (val.expression.value !== before) rewrites++;
        }
      },
      StringLiteral(path2) {
        if (t.isObjectProperty(path2.parent) && path2.parentKey === "key" && !path2.parent.computed) return;
        if (t.isImportDeclaration(path2.parent) || t.isExportAllDeclaration(path2.parent) || t.isExportNamedDeclaration(path2.parent)) return;
        if (path2.findParent((p) => p.isJSXAttribute())) return;
        const before = path2.node.value;
        const after = toCDN(before, cdn);
        if (after !== before) {
          path2.node.value = after;
          rewrites++;
        }
      },
      TemplateLiteral(path2) {
        if (path2.node.expressions.length) return;
        const raw = path2.node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("");
        const after = toCDN(raw, cdn);
        if (after !== raw) {
          path2.replaceWith(t.stringLiteral(after));
          rewrites++;
        }
      }
    });
    if (!rewrites) return null;
    const out = generate(ast, { retainLines: true, sourceMaps: false }, code).code;
    if (DEBUG) console.log(`[cdn] ${id} \u2192 ${rewrites} rewrites`);
    return out;
  };
  async function collectPublicImagesFrom(dir) {
    const imagesDir = nodePath.join(dir, "images");
    const stack = [imagesDir];
    while (stack.length) {
      const cur = stack.pop();
      let entries = [];
      try {
        entries = await fs.readdir(cur, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        const full = nodePath.join(cur, ent.name);
        if (ent.isDirectory()) {
          stack.push(full);
        } else if (ent.isFile()) {
          const rel = nodePath.relative(dir, full).split(nodePath.sep).join("/");
          const canonical = "/" + rel;
          imageSet.add(canonical);
          imageSet.add(canonical.slice(1));
        }
      }
    }
  }
  return {
    name: "cdn-prefix-images-existing",
    apply: "build",
    enforce: "pre",
    // run before @vitejs/plugin-react
    configResolved(cfg) {
      publicDir = cfg.publicDir;
      if (DEBUG) console.log("[cdn] publicDir =", publicDir);
    },
    async buildStart() {
      await collectPublicImagesFrom(publicDir);
      if (DEBUG) console.log("[cdn] images found:", imageSet.size);
    },
    transformIndexHtml(html) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return html;
      const out = rewriteHtml(html, cdn);
      if (DEBUG) console.log("[cdn] transformIndexHtml done");
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
    }
  };
}
function cssInliner() {
  return {
    name: "vite-css-inliner",
    apply: "build",
    enforce: "post",
    generateBundle(opts, bundle) {
      const htmlFile = Object.values(bundle).find(
        (file) => file.fileName === "index.html" && file.type === "asset"
      );
      if (!htmlFile) return;
      const cssLinkRegex = /<link[^>]*href="([^"]+\.css)"[^>]*>/g;
      const linkedCssFiles = [];
      let match;
      while ((match = cssLinkRegex.exec(htmlFile.source)) !== null) {
        const href = match[1];
        const bundleKey = href.replace(/^(\.\/|\/)/, "");
        linkedCssFiles.push(bundleKey);
      }
      let cssContent = "";
      const removedFiles = [];
      for (const file of linkedCssFiles) {
        if (bundle[file]) {
          const cssAsset = bundle[file];
          cssContent += cssAsset.source;
          delete bundle[file];
          removedFiles.push(file);
        }
      }
      if (cssContent) {
        const escapeRegExp = (string) => {
          return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        };
        for (const file of removedFiles) {
          const filename = path.basename(file);
          const reg = new RegExp(`<link[^>]*href="[^"]*${escapeRegExp(filename)}"[^>]*>`, "g");
          htmlFile.source = htmlFile.source.replace(reg, "");
        }
        htmlFile.source = htmlFile.source.replace(
          "</head>",
          `<style>${cssContent}</style></head>`
        );
        console.log(`[css-inliner] Inlined ${cssContent.length} bytes of CSS from ${removedFiles.join(", ")}`);
      } else {
        console.log("[css-inliner] No linked CSS files found to inline.");
      }
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      cdnPrefixImages(),
      cssInliner()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src"),
        // Proxy react-router-dom to our wrapper
        "react-router-dom": path.resolve(__vite_injected_original_dirname, "./src/lib/react-router-dom-proxy.tsx"),
        // Original react-router-dom under a different name
        "react-router-dom-original": "react-router-dom"
      }
    },
    define: {
      // Define environment variables for build-time configuration
      // In production, this will be false by default unless explicitly set to 'true'
      // In development and test, this will be true by default
      __ROUTE_MESSAGING_ENABLED__: JSON.stringify(
        mode === "production" ? process.env.VITE_ENABLE_ROUTE_MESSAGING === "true" : process.env.VITE_ENABLE_ROUTE_MESSAGING !== "false"
      )
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "ui-core": ["@radix-ui/react-slot", "class-variance-authority", "clsx", "tailwind-merge"],
            "animation": ["framer-motion"],
            "charts": ["recharts"],
            "date-fns": ["date-fns"],
            "database": ["@supabase/supabase-js"]
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtdW5jaFxcXFxEZXNrdG9wXFxcXGNvemluaGEtYW8tbHVjcm9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG11bmNoXFxcXERlc2t0b3BcXFxcY296aW5oYS1hby1sdWNyb1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbXVuY2gvRGVza3RvcC9jb3ppbmhhLWFvLWx1Y3JvL3ZpdGUuY29uZmlnLnRzXCI7Ly8gdml0ZS5jb25maWcudHNcbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cbmltcG9ydCB7IGRlZmluZUNvbmZpZywgdHlwZSBQbHVnaW4gfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IG5vZGVQYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tICdsb3ZhYmxlLXRhZ2dlcic7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ0BiYWJlbC9wYXJzZXInO1xuaW1wb3J0IF90cmF2ZXJzZSBmcm9tICdAYmFiZWwvdHJhdmVyc2UnO1xuaW1wb3J0IF9nZW5lcmF0ZSBmcm9tICdAYmFiZWwvZ2VuZXJhdG9yJztcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJztcblxuXG4vLyBDSlMvRVNNIGludGVyb3AgZm9yIEJhYmVsIGxpYnNcbmNvbnN0IHRyYXZlcnNlOiB0eXBlb2YgX3RyYXZlcnNlLmRlZmF1bHQgPSAoKF90cmF2ZXJzZSBhcyBhbnkpLmRlZmF1bHQgPz8gX3RyYXZlcnNlKSBhcyBhbnk7XG5jb25zdCBnZW5lcmF0ZTogdHlwZW9mIF9nZW5lcmF0ZS5kZWZhdWx0ID0gKChfZ2VuZXJhdGUgYXMgYW55KS5kZWZhdWx0ID8/IF9nZW5lcmF0ZSkgYXMgYW55O1xuXG5mdW5jdGlvbiBjZG5QcmVmaXhJbWFnZXMoKTogUGx1Z2luIHtcbiAgY29uc3QgREVCVUcgPSBwcm9jZXNzLmVudi5DRE5fSU1HX0RFQlVHID09PSAnMSc7XG4gIGxldCBwdWJsaWNEaXIgPSAnJzsgICAgICAgICAgICAgIC8vIGFic29sdXRlIHBhdGggdG8gVml0ZSBwdWJsaWMgZGlyXG4gIGNvbnN0IGltYWdlU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7IC8vIHN0b3JlcyBub3JtYWxpemVkICcvaW1hZ2VzLy4uLicgcGF0aHNcblxuICBjb25zdCBpc0Fic29sdXRlID0gKHA6IHN0cmluZykgPT5cbiAgICAvXig/OlthLXpdKzopP1xcL1xcLy9pLnRlc3QocCkgfHwgcC5zdGFydHNXaXRoKCdkYXRhOicpIHx8IHAuc3RhcnRzV2l0aCgnYmxvYjonKTtcblxuICAvLyBub3JtYWxpemUgYSByZWYgbGlrZSAnLi9pbWFnZXMveC5wbmcnLCAnLi4vaW1hZ2VzL3gucG5nJywgJy9pbWFnZXMveC5wbmcnIC0+ICcvaW1hZ2VzL3gucG5nJ1xuICBjb25zdCBub3JtYWxpemVSZWYgPSAocDogc3RyaW5nKSA9PiB7XG4gICAgbGV0IHMgPSBwLnRyaW0oKTtcbiAgICAvLyBxdWljayBiYWlsLW91dHNcbiAgICBpZiAoaXNBYnNvbHV0ZShzKSkgcmV0dXJuIHM7XG4gICAgLy8gc3RyaXAgbGVhZGluZyAuLyBhbmQgYW55IC4uLyBzZWdtZW50cyAod2UgdHJlYXQgcHVibGljLyBhcyByb290IGF0IHJ1bnRpbWUpXG4gICAgcyA9IHMucmVwbGFjZSgvXihcXC5cXC8pKy8sICcnKTtcbiAgICB3aGlsZSAocy5zdGFydHNXaXRoKCcuLi8nKSkgcyA9IHMuc2xpY2UoMyk7XG4gICAgaWYgKHMuc3RhcnRzV2l0aCgnLycpKSBzID0gcy5zbGljZSgxKTtcbiAgICAvLyBlbnN1cmUgaXQgc3RhcnRzIHdpdGggaW1hZ2VzL1xuICAgIGlmICghcy5zdGFydHNXaXRoKCdpbWFnZXMvJykpIHJldHVybiBwOyAvLyBub3QgdW5kZXIgaW1hZ2VzIFx1MjE5MiBsZWF2ZSBhcyBpc1xuICAgIHJldHVybiAnLycgKyBzOyAvLyBjYW5vbmljYWw6ICcvaW1hZ2VzLy4uLidcbiAgfTtcblxuICBjb25zdCB0b0NETiA9IChwOiBzdHJpbmcsIGNkbjogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbiA9IG5vcm1hbGl6ZVJlZihwKTtcbiAgICBpZiAoaXNBYnNvbHV0ZShuKSkgcmV0dXJuIG47XG4gICAgaWYgKCFuLnN0YXJ0c1dpdGgoJy9pbWFnZXMvJykpIHJldHVybiBwOyAgICAgICAgICAgLy8gbm90IG91ciBmb2xkZXJcbiAgICBpZiAoIWltYWdlU2V0LmhhcyhuKSkgcmV0dXJuIHA7ICAgICAgICAgICAgICAgICAgICAvLyBub3QgYW4gZXhpc3RpbmcgZmlsZVxuICAgIGNvbnN0IGJhc2UgPSBjZG4uZW5kc1dpdGgoJy8nKSA/IGNkbiA6IGNkbiArICcvJztcbiAgICByZXR1cm4gYmFzZSArIG4uc2xpY2UoMSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAnaHR0cHM6Ly9jZG4vLi4uL2ltYWdlcy8uLidcbiAgfTtcblxuICBjb25zdCByZXdyaXRlU3Jjc2V0TGlzdCA9ICh2YWx1ZTogc3RyaW5nLCBjZG46IHN0cmluZykgPT5cbiAgICB2YWx1ZVxuICAgICAgLnNwbGl0KCcsJylcbiAgICAgIC5tYXAoKHBhcnQpID0+IHtcbiAgICAgICAgY29uc3QgW3VybCwgZGVzY10gPSBwYXJ0LnRyaW0oKS5zcGxpdCgvXFxzKy8sIDIpO1xuICAgICAgICBjb25zdCBvdXQgPSB0b0NETih1cmwsIGNkbik7XG4gICAgICAgIHJldHVybiBkZXNjID8gYCR7b3V0fSAke2Rlc2N9YCA6IG91dDtcbiAgICAgIH0pXG4gICAgICAuam9pbignLCAnKTtcblxuICBjb25zdCByZXdyaXRlSHRtbCA9IChodG1sOiBzdHJpbmcsIGNkbjogc3RyaW5nKSA9PiB7XG4gICAgLy8gc3JjIC8gaHJlZlxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoXG4gICAgICAvKHNyY3xocmVmKVxccyo9XFxzKihbJ1wiXSkoW14nXCJdKylcXDIvZyxcbiAgICAgIChfbSwgaywgcSwgcCkgPT4gYCR7a309JHtxfSR7dG9DRE4ocCwgY2RuKX0ke3F9YFxuICAgICk7XG4gICAgLy8gc3Jjc2V0XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZShcbiAgICAgIC8oc3Jjc2V0KVxccyo9XFxzKihbJ1wiXSkoW14nXCJdKylcXDIvZyxcbiAgICAgIChfbSwgaywgcSwgbGlzdCkgPT4gYCR7a309JHtxfSR7cmV3cml0ZVNyY3NldExpc3QobGlzdCwgY2RuKX0ke3F9YFxuICAgICk7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH07XG5cbiAgY29uc3QgcmV3cml0ZUNzc1VybHMgPSAoY29kZTogc3RyaW5nLCBjZG46IHN0cmluZykgPT5cbiAgICBjb2RlLnJlcGxhY2UoL3VybFxcKChbJ1wiXT8pKFteJ1wiKV0rKVxcMVxcKS9nLCAoX20sIHEsIHApID0+IGB1cmwoJHtxfSR7dG9DRE4ocCwgY2RuKX0ke3F9KWApO1xuXG4gIGNvbnN0IHJld3JpdGVKc3hBc3QgPSAoY29kZTogc3RyaW5nLCBpZDogc3RyaW5nLCBjZG46IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGFzdCA9IHBhcnNlKGNvZGUsIHsgc291cmNlVHlwZTogJ21vZHVsZScsIHBsdWdpbnM6IFsndHlwZXNjcmlwdCcsICdqc3gnXSB9KTtcbiAgICBsZXQgcmV3cml0ZXMgPSAwO1xuXG4gICAgdHJhdmVyc2UoYXN0LCB7XG4gICAgICBKU1hBdHRyaWJ1dGUocGF0aCkge1xuICAgICAgICBjb25zdCBuYW1lID0gKHBhdGgubm9kZS5uYW1lIGFzIHQuSlNYSWRlbnRpZmllcikubmFtZTtcbiAgICAgICAgY29uc3QgaXNTcmMgPSBuYW1lID09PSAnc3JjJyB8fCBuYW1lID09PSAnaHJlZic7XG4gICAgICAgIGNvbnN0IGlzU3JjU2V0ID0gbmFtZSA9PT0gJ3NyY1NldCcgfHwgbmFtZSA9PT0gJ3NyY3NldCc7XG4gICAgICAgIGlmICghaXNTcmMgJiYgIWlzU3JjU2V0KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdmFsID0gcGF0aC5ub2RlLnZhbHVlO1xuICAgICAgICBpZiAoIXZhbCkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0LmlzU3RyaW5nTGl0ZXJhbCh2YWwpKSB7XG4gICAgICAgICAgY29uc3QgYmVmb3JlID0gdmFsLnZhbHVlO1xuICAgICAgICAgIHZhbC52YWx1ZSA9IGlzU3JjID8gdG9DRE4odmFsLnZhbHVlLCBjZG4pIDogcmV3cml0ZVNyY3NldExpc3QodmFsLnZhbHVlLCBjZG4pO1xuICAgICAgICAgIGlmICh2YWwudmFsdWUgIT09IGJlZm9yZSkgcmV3cml0ZXMrKztcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQuaXNKU1hFeHByZXNzaW9uQ29udGFpbmVyKHZhbCkgJiYgdC5pc1N0cmluZ0xpdGVyYWwodmFsLmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgY29uc3QgYmVmb3JlID0gdmFsLmV4cHJlc3Npb24udmFsdWU7XG4gICAgICAgICAgdmFsLmV4cHJlc3Npb24udmFsdWUgPSBpc1NyY1xuICAgICAgICAgICAgPyB0b0NETih2YWwuZXhwcmVzc2lvbi52YWx1ZSwgY2RuKVxuICAgICAgICAgICAgOiByZXdyaXRlU3Jjc2V0TGlzdCh2YWwuZXhwcmVzc2lvbi52YWx1ZSwgY2RuKTtcbiAgICAgICAgICBpZiAodmFsLmV4cHJlc3Npb24udmFsdWUgIT09IGJlZm9yZSkgcmV3cml0ZXMrKztcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgU3RyaW5nTGl0ZXJhbChwYXRoKSB7XG4gICAgICAgIC8vIHNraXAgb2JqZWN0IGtleXM6IHsgXCJpbWFnZVwiOiBcIi4uLlwiIH1cbiAgICAgICAgaWYgKHQuaXNPYmplY3RQcm9wZXJ0eShwYXRoLnBhcmVudCkgJiYgcGF0aC5wYXJlbnRLZXkgPT09ICdrZXknICYmICFwYXRoLnBhcmVudC5jb21wdXRlZCkgcmV0dXJuO1xuICAgICAgICAvLyBza2lwIGltcG9ydC9leHBvcnQgc291cmNlc1xuICAgICAgICBpZiAodC5pc0ltcG9ydERlY2xhcmF0aW9uKHBhdGgucGFyZW50KSB8fCB0LmlzRXhwb3J0QWxsRGVjbGFyYXRpb24ocGF0aC5wYXJlbnQpIHx8IHQuaXNFeHBvcnROYW1lZERlY2xhcmF0aW9uKHBhdGgucGFyZW50KSkgcmV0dXJuO1xuICAgICAgICAvLyBza2lwIGluc2lkZSBKU1ggYXR0cmlidXRlIChhbHJlYWR5IGhhbmRsZWQpXG4gICAgICAgIGlmIChwYXRoLmZpbmRQYXJlbnQocCA9PiBwLmlzSlNYQXR0cmlidXRlKCkpKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgYmVmb3JlID0gcGF0aC5ub2RlLnZhbHVlO1xuICAgICAgICBjb25zdCBhZnRlciA9IHRvQ0ROKGJlZm9yZSwgY2RuKTtcbiAgICAgICAgaWYgKGFmdGVyICE9PSBiZWZvcmUpIHsgcGF0aC5ub2RlLnZhbHVlID0gYWZ0ZXI7IHJld3JpdGVzKys7IH1cbiAgICAgIH0sXG5cbiAgICAgIFRlbXBsYXRlTGl0ZXJhbChwYXRoKSB7XG4gICAgICAgIC8vIGhhbmRsZSBgXCIvaW1hZ2VzL2Zvby5wbmdcImAgYXMgdGVtcGxhdGUgd2l0aCBOTyBleHByZXNzaW9uc1xuICAgICAgICBpZiAocGF0aC5ub2RlLmV4cHJlc3Npb25zLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBjb25zdCByYXcgPSBwYXRoLm5vZGUucXVhc2lzLm1hcChxID0+IHEudmFsdWUuY29va2VkID8/IHEudmFsdWUucmF3KS5qb2luKCcnKTtcbiAgICAgICAgY29uc3QgYWZ0ZXIgPSB0b0NETihyYXcsIGNkbik7XG4gICAgICAgIGlmIChhZnRlciAhPT0gcmF3KSB7XG4gICAgICAgICAgcGF0aC5yZXBsYWNlV2l0aCh0LnN0cmluZ0xpdGVyYWwoYWZ0ZXIpKTtcbiAgICAgICAgICByZXdyaXRlcysrO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBpZiAoIXJld3JpdGVzKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBvdXQgPSBnZW5lcmF0ZShhc3QsIHsgcmV0YWluTGluZXM6IHRydWUsIHNvdXJjZU1hcHM6IGZhbHNlIH0sIGNvZGUpLmNvZGU7XG4gICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZyhgW2Nkbl0gJHtpZH0gXHUyMTkyICR7cmV3cml0ZXN9IHJld3JpdGVzYCk7XG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICBhc3luYyBmdW5jdGlvbiBjb2xsZWN0UHVibGljSW1hZ2VzRnJvbShkaXI6IHN0cmluZykge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbGxlY3QgZXZlcnkgZmlsZSB1bmRlciBwdWJsaWMvaW1hZ2VzIGludG8gaW1hZ2VTZXQgYXMgJy9pbWFnZXMvcmVscGF0aCdcbiAgICBjb25zdCBpbWFnZXNEaXIgPSBub2RlUGF0aC5qb2luKGRpciwgJ2ltYWdlcycpO1xuICAgIGNvbnN0IHN0YWNrID0gW2ltYWdlc0Rpcl07XG4gICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgY29uc3QgY3VyID0gc3RhY2sucG9wKCkhO1xuICAgICAgbGV0IGVudHJpZXM6IGFueVtdID0gW107XG4gICAgICB0cnkge1xuICAgICAgICBlbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpcihjdXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBjb250aW51ZTsgLy8gaW1hZ2VzLyBtYXkgbm90IGV4aXN0XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGVudCBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IGZ1bGwgPSBub2RlUGF0aC5qb2luKGN1ciwgZW50Lm5hbWUpO1xuICAgICAgICBpZiAoZW50LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBzdGFjay5wdXNoKGZ1bGwpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudC5pc0ZpbGUoKSkge1xuICAgICAgICAgIGNvbnN0IHJlbCA9IG5vZGVQYXRoLnJlbGF0aXZlKGRpciwgZnVsbCkuc3BsaXQobm9kZVBhdGguc2VwKS5qb2luKCcvJyk7XG4gICAgICAgICAgY29uc3QgY2Fub25pY2FsID0gJy8nICsgcmVsOyAvLyAnL2ltYWdlcy8uLi4nXG4gICAgICAgICAgaW1hZ2VTZXQuYWRkKGNhbm9uaWNhbCk7XG4gICAgICAgICAgLy8gYWxzbyBhZGQgdmFyaWFudCB3aXRob3V0IGxlYWRpbmcgc2xhc2ggZm9yIHNhZmV0eVxuICAgICAgICAgIGltYWdlU2V0LmFkZChjYW5vbmljYWwuc2xpY2UoMSkpOyAvLyAnaW1hZ2VzLy4uLidcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2Nkbi1wcmVmaXgtaW1hZ2VzLWV4aXN0aW5nJyxcbiAgICBhcHBseTogJ2J1aWxkJyxcbiAgICBlbmZvcmNlOiAncHJlJywgLy8gcnVuIGJlZm9yZSBAdml0ZWpzL3BsdWdpbi1yZWFjdFxuXG4gICAgY29uZmlnUmVzb2x2ZWQoY2ZnKSB7XG4gICAgICBwdWJsaWNEaXIgPSBjZmcucHVibGljRGlyOyAvLyBhYnNvbHV0ZVxuICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZygnW2Nkbl0gcHVibGljRGlyID0nLCBwdWJsaWNEaXIpO1xuICAgIH0sXG5cbiAgICBhc3luYyBidWlsZFN0YXJ0KCkge1xuICAgICAgYXdhaXQgY29sbGVjdFB1YmxpY0ltYWdlc0Zyb20ocHVibGljRGlyKTtcbiAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coJ1tjZG5dIGltYWdlcyBmb3VuZDonLCBpbWFnZVNldC5zaXplKTtcbiAgICB9LFxuXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcbiAgICAgIGNvbnN0IGNkbiA9IHByb2Nlc3MuZW52LkNETl9JTUdfUFJFRklYO1xuICAgICAgaWYgKCFjZG4pIHJldHVybiBodG1sO1xuICAgICAgY29uc3Qgb3V0ID0gcmV3cml0ZUh0bWwoaHRtbCwgY2RuKTtcbiAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coJ1tjZG5dIHRyYW5zZm9ybUluZGV4SHRtbCBkb25lJyk7XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH0sXG5cbiAgICB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcbiAgICAgIGNvbnN0IGNkbiA9IHByb2Nlc3MuZW52LkNETl9JTUdfUFJFRklYO1xuICAgICAgaWYgKCFjZG4pIHJldHVybiBudWxsO1xuXG4gICAgICBpZiAoL1xcLihqc3h8dHN4KSQvLnRlc3QoaWQpKSB7XG4gICAgICAgIGNvbnN0IG91dCA9IHJld3JpdGVKc3hBc3QoY29kZSwgaWQsIGNkbik7XG4gICAgICAgIHJldHVybiBvdXQgPyB7IGNvZGU6IG91dCwgbWFwOiBudWxsIH0gOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoL1xcLihjc3N8c2Nzc3xzYXNzfGxlc3N8c3R5bCkkL2kudGVzdChpZCkpIHtcbiAgICAgICAgY29uc3Qgb3V0ID0gcmV3cml0ZUNzc1VybHMoY29kZSwgY2RuKTtcbiAgICAgICAgcmV0dXJuIG91dCA9PT0gY29kZSA/IG51bGwgOiB7IGNvZGU6IG91dCwgbWFwOiBudWxsIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNzc0lubGluZXIoKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndml0ZS1jc3MtaW5saW5lcicsXG4gICAgYXBwbHk6ICdidWlsZCcsXG4gICAgZW5mb3JjZTogJ3Bvc3QnLFxuICAgIGdlbmVyYXRlQnVuZGxlKG9wdHMsIGJ1bmRsZSkge1xuICAgICAgY29uc3QgaHRtbEZpbGUgPSBPYmplY3QudmFsdWVzKGJ1bmRsZSkuZmluZChcbiAgICAgICAgKGZpbGUpID0+IGZpbGUuZmlsZU5hbWUgPT09ICdpbmRleC5odG1sJyAmJiBmaWxlLnR5cGUgPT09ICdhc3NldCdcbiAgICAgICkgYXMgYW55O1xuXG4gICAgICBpZiAoIWh0bWxGaWxlKSByZXR1cm47XG5cbiAgICAgIC8vIEZpbmQgQ1NTIGZpbGVzIHJlZmVyZW5jZWQgaW4gdGhlIEhUTUxcbiAgICAgIC8vIE5vdGU6IFZpdGUgaW5qZWN0cyA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIi9hc3NldHMvaW5kZXgtLi4uLmNzc1wiPlxuICAgICAgY29uc3QgY3NzTGlua1JlZ2V4ID0gLzxsaW5rW14+XSpocmVmPVwiKFteXCJdK1xcLmNzcylcIltePl0qPi9nO1xuICAgICAgY29uc3QgbGlua2VkQ3NzRmlsZXM6IHN0cmluZ1tdID0gW107XG4gICAgICBsZXQgbWF0Y2g7XG5cbiAgICAgIHdoaWxlICgobWF0Y2ggPSBjc3NMaW5rUmVnZXguZXhlYyhodG1sRmlsZS5zb3VyY2UpKSAhPT0gbnVsbCkge1xuICAgICAgICAvLyBtYXRjaFsxXSB3aWxsIGJlIGxpa2UgXCIvYXNzZXRzL2luZGV4LUMxMjM0LmNzc1wiIG9yIFwiLi9hc3NldHMvLi5cIlxuICAgICAgICAvLyBXZSBuZWVkIHRvIG1hcCB0aGlzIGJhY2sgdG8gdGhlIGJ1bmRsZSBrZXkuXG4gICAgICAgIC8vIEJ1bmRsZSBrZXlzIGFyZSB0eXBpY2FsbHkgXCJhc3NldHMvaW5kZXgtQzEyMzQuY3NzXCIgKG5vIGxlYWRpbmcgc2xhc2ggb3IgZG90KVxuICAgICAgICBjb25zdCBocmVmID0gbWF0Y2hbMV07XG4gICAgICAgIGNvbnN0IGJ1bmRsZUtleSA9IGhyZWYucmVwbGFjZSgvXihcXC5cXC98XFwvKS8sICcnKTtcbiAgICAgICAgbGlua2VkQ3NzRmlsZXMucHVzaChidW5kbGVLZXkpO1xuICAgICAgfVxuXG4gICAgICBsZXQgY3NzQ29udGVudCA9ICcnO1xuICAgICAgY29uc3QgcmVtb3ZlZEZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAvLyBPbmx5IGlubGluZSB0aGUgZmlsZXMgYWN0dWFsbHkgbGlua2VkIGluIGluZGV4Lmh0bWwgKENyaXRpY2FsIENTUylcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBsaW5rZWRDc3NGaWxlcykge1xuICAgICAgICBpZiAoYnVuZGxlW2ZpbGVdKSB7XG4gICAgICAgICAgY29uc3QgY3NzQXNzZXQgPSBidW5kbGVbZmlsZV0gYXMgYW55O1xuICAgICAgICAgIGNzc0NvbnRlbnQgKz0gY3NzQXNzZXQuc291cmNlO1xuICAgICAgICAgIGRlbGV0ZSBidW5kbGVbZmlsZV07XG4gICAgICAgICAgcmVtb3ZlZEZpbGVzLnB1c2goZmlsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNzc0NvbnRlbnQpIHtcbiAgICAgICAgLy8gRGVmaW5lIGEgZnVuY3Rpb24gdG8gZXNjYXBlIHJlZ2V4IHNwZWNpYWwgY2hhcmFjdGVyc1xuICAgICAgICBjb25zdCBlc2NhcGVSZWdFeHAgPSAoc3RyaW5nOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVtb3ZlIDxsaW5rPiB0YWdzIGZvciBpbmxpbmVkIGZpbGVzXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiByZW1vdmVkRmlsZXMpIHtcbiAgICAgICAgICAvLyBXZSBuZWVkIHRvIGJlIGNhcmVmdWwgdG8gbWF0Y2ggdGhlIHNwZWNpZmljIGhyZWYgdGhhdCB3YXMgZm91bmQgZWFybGllclxuICAgICAgICAgIC8vIFRoZSBzaW1wbGVzdCB3YXkgbWlnaHQgYmUgdG8gcmVnZXggbWF0Y2ggdGhlIGZpbGVuYW1lIHBvcnRpb25cbiAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZSk7XG4gICAgICAgICAgY29uc3QgcmVnID0gbmV3IFJlZ0V4cChgPGxpbmtbXj5dKmhyZWY9XCJbXlwiXSoke2VzY2FwZVJlZ0V4cChmaWxlbmFtZSl9XCJbXj5dKj5gLCAnZycpO1xuICAgICAgICAgIGh0bWxGaWxlLnNvdXJjZSA9IGh0bWxGaWxlLnNvdXJjZS5yZXBsYWNlKHJlZywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW5qZWN0IGlubGluZWQgQ1NTXG4gICAgICAgIGh0bWxGaWxlLnNvdXJjZSA9IGh0bWxGaWxlLnNvdXJjZS5yZXBsYWNlKFxuICAgICAgICAgICc8L2hlYWQ+JyxcbiAgICAgICAgICBgPHN0eWxlPiR7Y3NzQ29udGVudH08L3N0eWxlPjwvaGVhZD5gXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYFtjc3MtaW5saW5lcl0gSW5saW5lZCAke2Nzc0NvbnRlbnQubGVuZ3RofSBieXRlcyBvZiBDU1MgZnJvbSAke3JlbW92ZWRGaWxlcy5qb2luKCcsICcpfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tjc3MtaW5saW5lcl0gTm8gbGlua2VkIENTUyBmaWxlcyBmb3VuZCB0byBpbmxpbmUuJyk7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxuICAgICAgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgICBjZG5QcmVmaXhJbWFnZXMoKSxcbiAgICAgIGNzc0lubGluZXIoKSxcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICAgLy8gUHJveHkgcmVhY3Qtcm91dGVyLWRvbSB0byBvdXIgd3JhcHBlclxuICAgICAgICBcInJlYWN0LXJvdXRlci1kb21cIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9saWIvcmVhY3Qtcm91dGVyLWRvbS1wcm94eS50c3hcIiksXG4gICAgICAgIC8vIE9yaWdpbmFsIHJlYWN0LXJvdXRlci1kb20gdW5kZXIgYSBkaWZmZXJlbnQgbmFtZVxuICAgICAgICBcInJlYWN0LXJvdXRlci1kb20tb3JpZ2luYWxcIjogXCJyZWFjdC1yb3V0ZXItZG9tXCIsXG4gICAgICB9LFxuICAgIH0sXG4gICAgZGVmaW5lOiB7XG4gICAgICAvLyBEZWZpbmUgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciBidWlsZC10aW1lIGNvbmZpZ3VyYXRpb25cbiAgICAgIC8vIEluIHByb2R1Y3Rpb24sIHRoaXMgd2lsbCBiZSBmYWxzZSBieSBkZWZhdWx0IHVubGVzcyBleHBsaWNpdGx5IHNldCB0byAndHJ1ZSdcbiAgICAgIC8vIEluIGRldmVsb3BtZW50IGFuZCB0ZXN0LCB0aGlzIHdpbGwgYmUgdHJ1ZSBieSBkZWZhdWx0XG4gICAgICBfX1JPVVRFX01FU1NBR0lOR19FTkFCTEVEX186IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICBtb2RlID09PSAncHJvZHVjdGlvbidcbiAgICAgICAgICA/IHByb2Nlc3MuZW52LlZJVEVfRU5BQkxFX1JPVVRFX01FU1NBR0lORyA9PT0gJ3RydWUnXG4gICAgICAgICAgOiBwcm9jZXNzLmVudi5WSVRFX0VOQUJMRV9ST1VURV9NRVNTQUdJTkcgIT09ICdmYWxzZSdcbiAgICAgICksXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgICAndWktY29yZSc6IFsnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLCAnY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5JywgJ2Nsc3gnLCAndGFpbHdpbmQtbWVyZ2UnXSxcbiAgICAgICAgICAgICdhbmltYXRpb24nOiBbJ2ZyYW1lci1tb3Rpb24nXSxcbiAgICAgICAgICAgICdjaGFydHMnOiBbJ3JlY2hhcnRzJ10sXG4gICAgICAgICAgICAnZGF0ZS1mbnMnOiBbJ2RhdGUtZm5zJ10sXG4gICAgICAgICAgICAnZGF0YWJhc2UnOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyxvQkFBaUM7QUFDMUMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sUUFBUTtBQUNmLE9BQU8sY0FBYztBQUNyQixTQUFTLHVCQUF1QjtBQUNoQyxPQUFPLFVBQVU7QUFFakIsU0FBUyxhQUFhO0FBQ3RCLE9BQU8sZUFBZTtBQUN0QixPQUFPLGVBQWU7QUFDdEIsWUFBWSxPQUFPO0FBWm5CLElBQU0sbUNBQW1DO0FBZ0J6QyxJQUFNLFdBQXVDLFVBQWtCLFdBQVc7QUFDMUUsSUFBTSxXQUF1QyxVQUFrQixXQUFXO0FBRTFFLFNBQVMsa0JBQTBCO0FBQ2pDLFFBQU0sUUFBUSxRQUFRLElBQUksa0JBQWtCO0FBQzVDLE1BQUksWUFBWTtBQUNoQixRQUFNLFdBQVcsb0JBQUksSUFBWTtBQUVqQyxRQUFNLGFBQWEsQ0FBQyxNQUNsQixxQkFBcUIsS0FBSyxDQUFDLEtBQUssRUFBRSxXQUFXLE9BQU8sS0FBSyxFQUFFLFdBQVcsT0FBTztBQUcvRSxRQUFNLGVBQWUsQ0FBQyxNQUFjO0FBQ2xDLFFBQUksSUFBSSxFQUFFLEtBQUs7QUFFZixRQUFJLFdBQVcsQ0FBQyxFQUFHLFFBQU87QUFFMUIsUUFBSSxFQUFFLFFBQVEsWUFBWSxFQUFFO0FBQzVCLFdBQU8sRUFBRSxXQUFXLEtBQUssRUFBRyxLQUFJLEVBQUUsTUFBTSxDQUFDO0FBQ3pDLFFBQUksRUFBRSxXQUFXLEdBQUcsRUFBRyxLQUFJLEVBQUUsTUFBTSxDQUFDO0FBRXBDLFFBQUksQ0FBQyxFQUFFLFdBQVcsU0FBUyxFQUFHLFFBQU87QUFDckMsV0FBTyxNQUFNO0FBQUEsRUFDZjtBQUVBLFFBQU0sUUFBUSxDQUFDLEdBQVcsUUFBZ0I7QUFDeEMsVUFBTSxJQUFJLGFBQWEsQ0FBQztBQUN4QixRQUFJLFdBQVcsQ0FBQyxFQUFHLFFBQU87QUFDMUIsUUFBSSxDQUFDLEVBQUUsV0FBVyxVQUFVLEVBQUcsUUFBTztBQUN0QyxRQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsRUFBRyxRQUFPO0FBQzdCLFVBQU0sT0FBTyxJQUFJLFNBQVMsR0FBRyxJQUFJLE1BQU0sTUFBTTtBQUM3QyxXQUFPLE9BQU8sRUFBRSxNQUFNLENBQUM7QUFBQSxFQUN6QjtBQUVBLFFBQU0sb0JBQW9CLENBQUMsT0FBZSxRQUN4QyxNQUNHLE1BQU0sR0FBRyxFQUNULElBQUksQ0FBQyxTQUFTO0FBQ2IsVUFBTSxDQUFDLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBQzlDLFVBQU0sTUFBTSxNQUFNLEtBQUssR0FBRztBQUMxQixXQUFPLE9BQU8sR0FBRyxHQUFHLElBQUksSUFBSSxLQUFLO0FBQUEsRUFDbkMsQ0FBQyxFQUNBLEtBQUssSUFBSTtBQUVkLFFBQU0sY0FBYyxDQUFDLE1BQWMsUUFBZ0I7QUFFakQsV0FBTyxLQUFLO0FBQUEsTUFDVjtBQUFBLE1BQ0EsQ0FBQyxJQUFJLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUFBLElBQ2hEO0FBRUEsV0FBTyxLQUFLO0FBQUEsTUFDVjtBQUFBLE1BQ0EsQ0FBQyxJQUFJLEdBQUcsR0FBRyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDO0FBQUEsSUFDbEU7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0saUJBQWlCLENBQUMsTUFBYyxRQUNwQyxLQUFLLFFBQVEsOEJBQThCLENBQUMsSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRztBQUUxRixRQUFNLGdCQUFnQixDQUFDLE1BQWMsSUFBWSxRQUFnQjtBQUMvRCxVQUFNLE1BQU0sTUFBTSxNQUFNLEVBQUUsWUFBWSxVQUFVLFNBQVMsQ0FBQyxjQUFjLEtBQUssRUFBRSxDQUFDO0FBQ2hGLFFBQUksV0FBVztBQUVmLGFBQVMsS0FBSztBQUFBLE1BQ1osYUFBYUEsT0FBTTtBQUNqQixjQUFNLE9BQVFBLE1BQUssS0FBSyxLQUF5QjtBQUNqRCxjQUFNLFFBQVEsU0FBUyxTQUFTLFNBQVM7QUFDekMsY0FBTSxXQUFXLFNBQVMsWUFBWSxTQUFTO0FBQy9DLFlBQUksQ0FBQyxTQUFTLENBQUMsU0FBVTtBQUV6QixjQUFNLE1BQU1BLE1BQUssS0FBSztBQUN0QixZQUFJLENBQUMsSUFBSztBQUVWLFlBQU0sa0JBQWdCLEdBQUcsR0FBRztBQUMxQixnQkFBTSxTQUFTLElBQUk7QUFDbkIsY0FBSSxRQUFRLFFBQVEsTUFBTSxJQUFJLE9BQU8sR0FBRyxJQUFJLGtCQUFrQixJQUFJLE9BQU8sR0FBRztBQUM1RSxjQUFJLElBQUksVUFBVSxPQUFRO0FBQzFCO0FBQUEsUUFDRjtBQUNBLFlBQU0sMkJBQXlCLEdBQUcsS0FBTyxrQkFBZ0IsSUFBSSxVQUFVLEdBQUc7QUFDeEUsZ0JBQU0sU0FBUyxJQUFJLFdBQVc7QUFDOUIsY0FBSSxXQUFXLFFBQVEsUUFDbkIsTUFBTSxJQUFJLFdBQVcsT0FBTyxHQUFHLElBQy9CLGtCQUFrQixJQUFJLFdBQVcsT0FBTyxHQUFHO0FBQy9DLGNBQUksSUFBSSxXQUFXLFVBQVUsT0FBUTtBQUFBLFFBQ3ZDO0FBQUEsTUFDRjtBQUFBLE1BRUEsY0FBY0EsT0FBTTtBQUVsQixZQUFNLG1CQUFpQkEsTUFBSyxNQUFNLEtBQUtBLE1BQUssY0FBYyxTQUFTLENBQUNBLE1BQUssT0FBTyxTQUFVO0FBRTFGLFlBQU0sc0JBQW9CQSxNQUFLLE1BQU0sS0FBTyx5QkFBdUJBLE1BQUssTUFBTSxLQUFPLDJCQUF5QkEsTUFBSyxNQUFNLEVBQUc7QUFFNUgsWUFBSUEsTUFBSyxXQUFXLE9BQUssRUFBRSxlQUFlLENBQUMsRUFBRztBQUU5QyxjQUFNLFNBQVNBLE1BQUssS0FBSztBQUN6QixjQUFNLFFBQVEsTUFBTSxRQUFRLEdBQUc7QUFDL0IsWUFBSSxVQUFVLFFBQVE7QUFBRSxVQUFBQSxNQUFLLEtBQUssUUFBUTtBQUFPO0FBQUEsUUFBWTtBQUFBLE1BQy9EO0FBQUEsTUFFQSxnQkFBZ0JBLE9BQU07QUFFcEIsWUFBSUEsTUFBSyxLQUFLLFlBQVksT0FBUTtBQUNsQyxjQUFNLE1BQU1BLE1BQUssS0FBSyxPQUFPLElBQUksT0FBSyxFQUFFLE1BQU0sVUFBVSxFQUFFLE1BQU0sR0FBRyxFQUFFLEtBQUssRUFBRTtBQUM1RSxjQUFNLFFBQVEsTUFBTSxLQUFLLEdBQUc7QUFDNUIsWUFBSSxVQUFVLEtBQUs7QUFDakIsVUFBQUEsTUFBSyxZQUFjLGdCQUFjLEtBQUssQ0FBQztBQUN2QztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFFRixDQUFDO0FBRUQsUUFBSSxDQUFDLFNBQVUsUUFBTztBQUN0QixVQUFNLE1BQU0sU0FBUyxLQUFLLEVBQUUsYUFBYSxNQUFNLFlBQVksTUFBTSxHQUFHLElBQUksRUFBRTtBQUMxRSxRQUFJLE1BQU8sU0FBUSxJQUFJLFNBQVMsRUFBRSxXQUFNLFFBQVEsV0FBVztBQUMzRCxXQUFPO0FBQUEsRUFDVDtBQUVBLGlCQUFlLHdCQUF3QixLQUFhO0FBRWxELFVBQU0sWUFBWSxTQUFTLEtBQUssS0FBSyxRQUFRO0FBQzdDLFVBQU0sUUFBUSxDQUFDLFNBQVM7QUFDeEIsV0FBTyxNQUFNLFFBQVE7QUFDbkIsWUFBTSxNQUFNLE1BQU0sSUFBSTtBQUN0QixVQUFJLFVBQWlCLENBQUM7QUFDdEIsVUFBSTtBQUNGLGtCQUFVLE1BQU0sR0FBRyxRQUFRLEtBQUssRUFBRSxlQUFlLEtBQUssQ0FBQztBQUFBLE1BQ3pELFFBQVE7QUFDTjtBQUFBLE1BQ0Y7QUFDQSxpQkFBVyxPQUFPLFNBQVM7QUFDekIsY0FBTSxPQUFPLFNBQVMsS0FBSyxLQUFLLElBQUksSUFBSTtBQUN4QyxZQUFJLElBQUksWUFBWSxHQUFHO0FBQ3JCLGdCQUFNLEtBQUssSUFBSTtBQUFBLFFBQ2pCLFdBQVcsSUFBSSxPQUFPLEdBQUc7QUFDdkIsZ0JBQU0sTUFBTSxTQUFTLFNBQVMsS0FBSyxJQUFJLEVBQUUsTUFBTSxTQUFTLEdBQUcsRUFBRSxLQUFLLEdBQUc7QUFDckUsZ0JBQU0sWUFBWSxNQUFNO0FBQ3hCLG1CQUFTLElBQUksU0FBUztBQUV0QixtQkFBUyxJQUFJLFVBQVUsTUFBTSxDQUFDLENBQUM7QUFBQSxRQUNqQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLFNBQVM7QUFBQTtBQUFBLElBRVQsZUFBZSxLQUFLO0FBQ2xCLGtCQUFZLElBQUk7QUFDaEIsVUFBSSxNQUFPLFNBQVEsSUFBSSxxQkFBcUIsU0FBUztBQUFBLElBQ3ZEO0FBQUEsSUFFQSxNQUFNLGFBQWE7QUFDakIsWUFBTSx3QkFBd0IsU0FBUztBQUN2QyxVQUFJLE1BQU8sU0FBUSxJQUFJLHVCQUF1QixTQUFTLElBQUk7QUFBQSxJQUM3RDtBQUFBLElBRUEsbUJBQW1CLE1BQU07QUFDdkIsWUFBTSxNQUFNLFFBQVEsSUFBSTtBQUN4QixVQUFJLENBQUMsSUFBSyxRQUFPO0FBQ2pCLFlBQU0sTUFBTSxZQUFZLE1BQU0sR0FBRztBQUNqQyxVQUFJLE1BQU8sU0FBUSxJQUFJLCtCQUErQjtBQUN0RCxhQUFPO0FBQUEsSUFDVDtBQUFBLElBRUEsVUFBVSxNQUFNLElBQUk7QUFDbEIsWUFBTSxNQUFNLFFBQVEsSUFBSTtBQUN4QixVQUFJLENBQUMsSUFBSyxRQUFPO0FBRWpCLFVBQUksZUFBZSxLQUFLLEVBQUUsR0FBRztBQUMzQixjQUFNLE1BQU0sY0FBYyxNQUFNLElBQUksR0FBRztBQUN2QyxlQUFPLE1BQU0sRUFBRSxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUk7QUFBQSxNQUMxQztBQUVBLFVBQUksZ0NBQWdDLEtBQUssRUFBRSxHQUFHO0FBQzVDLGNBQU0sTUFBTSxlQUFlLE1BQU0sR0FBRztBQUNwQyxlQUFPLFFBQVEsT0FBTyxPQUFPLEVBQUUsTUFBTSxLQUFLLEtBQUssS0FBSztBQUFBLE1BQ3REO0FBRUEsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTLGFBQXFCO0FBQzVCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLFNBQVM7QUFBQSxJQUNULGVBQWUsTUFBTSxRQUFRO0FBQzNCLFlBQU0sV0FBVyxPQUFPLE9BQU8sTUFBTSxFQUFFO0FBQUEsUUFDckMsQ0FBQyxTQUFTLEtBQUssYUFBYSxnQkFBZ0IsS0FBSyxTQUFTO0FBQUEsTUFDNUQ7QUFFQSxVQUFJLENBQUMsU0FBVTtBQUlmLFlBQU0sZUFBZTtBQUNyQixZQUFNLGlCQUEyQixDQUFDO0FBQ2xDLFVBQUk7QUFFSixjQUFRLFFBQVEsYUFBYSxLQUFLLFNBQVMsTUFBTSxPQUFPLE1BQU07QUFJNUQsY0FBTSxPQUFPLE1BQU0sQ0FBQztBQUNwQixjQUFNLFlBQVksS0FBSyxRQUFRLGNBQWMsRUFBRTtBQUMvQyx1QkFBZSxLQUFLLFNBQVM7QUFBQSxNQUMvQjtBQUVBLFVBQUksYUFBYTtBQUNqQixZQUFNLGVBQXlCLENBQUM7QUFHaEMsaUJBQVcsUUFBUSxnQkFBZ0I7QUFDakMsWUFBSSxPQUFPLElBQUksR0FBRztBQUNoQixnQkFBTSxXQUFXLE9BQU8sSUFBSTtBQUM1Qix3QkFBYyxTQUFTO0FBQ3ZCLGlCQUFPLE9BQU8sSUFBSTtBQUNsQix1QkFBYSxLQUFLLElBQUk7QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFFQSxVQUFJLFlBQVk7QUFFZCxjQUFNLGVBQWUsQ0FBQyxXQUFtQjtBQUN2QyxpQkFBTyxPQUFPLFFBQVEsdUJBQXVCLE1BQU07QUFBQSxRQUNyRDtBQUdBLG1CQUFXLFFBQVEsY0FBYztBQUcvQixnQkFBTSxXQUFXLEtBQUssU0FBUyxJQUFJO0FBQ25DLGdCQUFNLE1BQU0sSUFBSSxPQUFPLHdCQUF3QixhQUFhLFFBQVEsQ0FBQyxXQUFXLEdBQUc7QUFDbkYsbUJBQVMsU0FBUyxTQUFTLE9BQU8sUUFBUSxLQUFLLEVBQUU7QUFBQSxRQUNuRDtBQUdBLGlCQUFTLFNBQVMsU0FBUyxPQUFPO0FBQUEsVUFDaEM7QUFBQSxVQUNBLFVBQVUsVUFBVTtBQUFBLFFBQ3RCO0FBRUEsZ0JBQVEsSUFBSSx5QkFBeUIsV0FBVyxNQUFNLHNCQUFzQixhQUFhLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFBQSxNQUN2RyxPQUFPO0FBQ0wsZ0JBQVEsSUFBSSxvREFBb0Q7QUFBQSxNQUNsRTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQSxNQUNoQixnQkFBZ0I7QUFBQSxNQUNoQixXQUFXO0FBQUEsSUFDYixFQUFFLE9BQU8sT0FBTztBQUFBLElBQ2hCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQTtBQUFBLFFBRXBDLG9CQUFvQixLQUFLLFFBQVEsa0NBQVcsc0NBQXNDO0FBQUE7QUFBQSxRQUVsRiw2QkFBNkI7QUFBQSxNQUMvQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUlOLDZCQUE2QixLQUFLO0FBQUEsUUFDaEMsU0FBUyxlQUNMLFFBQVEsSUFBSSxnQ0FBZ0MsU0FDNUMsUUFBUSxJQUFJLGdDQUFnQztBQUFBLE1BQ2xEO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFlBQ1osZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFlBQ3pELFdBQVcsQ0FBQyx3QkFBd0IsNEJBQTRCLFFBQVEsZ0JBQWdCO0FBQUEsWUFDeEYsYUFBYSxDQUFDLGVBQWU7QUFBQSxZQUM3QixVQUFVLENBQUMsVUFBVTtBQUFBLFlBQ3JCLFlBQVksQ0FBQyxVQUFVO0FBQUEsWUFDdkIsWUFBWSxDQUFDLHVCQUF1QjtBQUFBLFVBQ3RDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
