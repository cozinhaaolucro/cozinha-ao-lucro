// vite.config.ts
import { defineConfig } from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/.pnpm/vite@5.4.20_@types+node@22.18.9/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/.pnpm/@vitejs+plugin-react-swc@3._17481a1ce83dfa9984b993dab1a94396/node_modules/@vitejs/plugin-react-swc/index.js";
import fs from "node:fs/promises";
import nodePath from "node:path";
import { componentTagger } from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/.pnpm/lovable-tagger@1.1.10_vite@5.4.20_@types+node@22.18.9_/node_modules/lovable-tagger/dist/index.js";
import path from "path";
import { parse } from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/.pnpm/@babel+parser@7.28.4/node_modules/@babel/parser/lib/index.js";
import _traverse from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/.pnpm/@babel+traverse@7.28.4/node_modules/@babel/traverse/lib/index.js";
import _generate from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/.pnpm/@babel+generator@7.28.3/node_modules/@babel/generator/lib/index.js";
import * as t from "file:///C:/Users/munch/Desktop/cozinha-ao-lucro/node_modules/.pnpm/@babel+types@7.28.4/node_modules/@babel/types/lib/index.js";
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
var vite_config_default = defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      cdnPrefixImages()
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
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtdW5jaFxcXFxEZXNrdG9wXFxcXGNvemluaGEtYW8tbHVjcm9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG11bmNoXFxcXERlc2t0b3BcXFxcY296aW5oYS1hby1sdWNyb1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbXVuY2gvRGVza3RvcC9jb3ppbmhhLWFvLWx1Y3JvL3ZpdGUuY29uZmlnLnRzXCI7Ly8gdml0ZS5jb25maWcudHNcbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cbmltcG9ydCB7IGRlZmluZUNvbmZpZywgdHlwZSBQbHVnaW4gfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IG5vZGVQYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tICdsb3ZhYmxlLXRhZ2dlcic7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ0BiYWJlbC9wYXJzZXInO1xuaW1wb3J0IF90cmF2ZXJzZSBmcm9tICdAYmFiZWwvdHJhdmVyc2UnO1xuaW1wb3J0IF9nZW5lcmF0ZSBmcm9tICdAYmFiZWwvZ2VuZXJhdG9yJztcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJztcblxuXG4vLyBDSlMvRVNNIGludGVyb3AgZm9yIEJhYmVsIGxpYnNcbmNvbnN0IHRyYXZlcnNlOiB0eXBlb2YgX3RyYXZlcnNlLmRlZmF1bHQgPSAoKF90cmF2ZXJzZSBhcyBhbnkpLmRlZmF1bHQgPz8gX3RyYXZlcnNlKSBhcyBhbnk7XG5jb25zdCBnZW5lcmF0ZTogdHlwZW9mIF9nZW5lcmF0ZS5kZWZhdWx0ID0gKChfZ2VuZXJhdGUgYXMgYW55KS5kZWZhdWx0ID8/IF9nZW5lcmF0ZSkgYXMgYW55O1xuXG5mdW5jdGlvbiBjZG5QcmVmaXhJbWFnZXMoKTogUGx1Z2luIHtcbiAgY29uc3QgREVCVUcgPSBwcm9jZXNzLmVudi5DRE5fSU1HX0RFQlVHID09PSAnMSc7XG4gIGxldCBwdWJsaWNEaXIgPSAnJzsgICAgICAgICAgICAgIC8vIGFic29sdXRlIHBhdGggdG8gVml0ZSBwdWJsaWMgZGlyXG4gIGNvbnN0IGltYWdlU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7IC8vIHN0b3JlcyBub3JtYWxpemVkICcvaW1hZ2VzLy4uLicgcGF0aHNcblxuICBjb25zdCBpc0Fic29sdXRlID0gKHA6IHN0cmluZykgPT5cbiAgICAvXig/OlthLXpdKzopP1xcL1xcLy9pLnRlc3QocCkgfHwgcC5zdGFydHNXaXRoKCdkYXRhOicpIHx8IHAuc3RhcnRzV2l0aCgnYmxvYjonKTtcblxuICAvLyBub3JtYWxpemUgYSByZWYgbGlrZSAnLi9pbWFnZXMveC5wbmcnLCAnLi4vaW1hZ2VzL3gucG5nJywgJy9pbWFnZXMveC5wbmcnIC0+ICcvaW1hZ2VzL3gucG5nJ1xuICBjb25zdCBub3JtYWxpemVSZWYgPSAocDogc3RyaW5nKSA9PiB7XG4gICAgbGV0IHMgPSBwLnRyaW0oKTtcbiAgICAvLyBxdWljayBiYWlsLW91dHNcbiAgICBpZiAoaXNBYnNvbHV0ZShzKSkgcmV0dXJuIHM7XG4gICAgLy8gc3RyaXAgbGVhZGluZyAuLyBhbmQgYW55IC4uLyBzZWdtZW50cyAod2UgdHJlYXQgcHVibGljLyBhcyByb290IGF0IHJ1bnRpbWUpXG4gICAgcyA9IHMucmVwbGFjZSgvXihcXC5cXC8pKy8sICcnKTtcbiAgICB3aGlsZSAocy5zdGFydHNXaXRoKCcuLi8nKSkgcyA9IHMuc2xpY2UoMyk7XG4gICAgaWYgKHMuc3RhcnRzV2l0aCgnLycpKSBzID0gcy5zbGljZSgxKTtcbiAgICAvLyBlbnN1cmUgaXQgc3RhcnRzIHdpdGggaW1hZ2VzL1xuICAgIGlmICghcy5zdGFydHNXaXRoKCdpbWFnZXMvJykpIHJldHVybiBwOyAvLyBub3QgdW5kZXIgaW1hZ2VzIFx1MjE5MiBsZWF2ZSBhcyBpc1xuICAgIHJldHVybiAnLycgKyBzOyAvLyBjYW5vbmljYWw6ICcvaW1hZ2VzLy4uLidcbiAgfTtcblxuICBjb25zdCB0b0NETiA9IChwOiBzdHJpbmcsIGNkbjogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbiA9IG5vcm1hbGl6ZVJlZihwKTtcbiAgICBpZiAoaXNBYnNvbHV0ZShuKSkgcmV0dXJuIG47XG4gICAgaWYgKCFuLnN0YXJ0c1dpdGgoJy9pbWFnZXMvJykpIHJldHVybiBwOyAgICAgICAgICAgLy8gbm90IG91ciBmb2xkZXJcbiAgICBpZiAoIWltYWdlU2V0LmhhcyhuKSkgcmV0dXJuIHA7ICAgICAgICAgICAgICAgICAgICAvLyBub3QgYW4gZXhpc3RpbmcgZmlsZVxuICAgIGNvbnN0IGJhc2UgPSBjZG4uZW5kc1dpdGgoJy8nKSA/IGNkbiA6IGNkbiArICcvJztcbiAgICByZXR1cm4gYmFzZSArIG4uc2xpY2UoMSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAnaHR0cHM6Ly9jZG4vLi4uL2ltYWdlcy8uLidcbiAgfTtcblxuICBjb25zdCByZXdyaXRlU3Jjc2V0TGlzdCA9ICh2YWx1ZTogc3RyaW5nLCBjZG46IHN0cmluZykgPT5cbiAgICB2YWx1ZVxuICAgICAgLnNwbGl0KCcsJylcbiAgICAgIC5tYXAoKHBhcnQpID0+IHtcbiAgICAgICAgY29uc3QgW3VybCwgZGVzY10gPSBwYXJ0LnRyaW0oKS5zcGxpdCgvXFxzKy8sIDIpO1xuICAgICAgICBjb25zdCBvdXQgPSB0b0NETih1cmwsIGNkbik7XG4gICAgICAgIHJldHVybiBkZXNjID8gYCR7b3V0fSAke2Rlc2N9YCA6IG91dDtcbiAgICAgIH0pXG4gICAgICAuam9pbignLCAnKTtcblxuICBjb25zdCByZXdyaXRlSHRtbCA9IChodG1sOiBzdHJpbmcsIGNkbjogc3RyaW5nKSA9PiB7XG4gICAgLy8gc3JjIC8gaHJlZlxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoXG4gICAgICAvKHNyY3xocmVmKVxccyo9XFxzKihbJ1wiXSkoW14nXCJdKylcXDIvZyxcbiAgICAgIChfbSwgaywgcSwgcCkgPT4gYCR7a309JHtxfSR7dG9DRE4ocCwgY2RuKX0ke3F9YFxuICAgICk7XG4gICAgLy8gc3Jjc2V0XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZShcbiAgICAgIC8oc3Jjc2V0KVxccyo9XFxzKihbJ1wiXSkoW14nXCJdKylcXDIvZyxcbiAgICAgIChfbSwgaywgcSwgbGlzdCkgPT4gYCR7a309JHtxfSR7cmV3cml0ZVNyY3NldExpc3QobGlzdCwgY2RuKX0ke3F9YFxuICAgICk7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH07XG5cbiAgY29uc3QgcmV3cml0ZUNzc1VybHMgPSAoY29kZTogc3RyaW5nLCBjZG46IHN0cmluZykgPT5cbiAgICBjb2RlLnJlcGxhY2UoL3VybFxcKChbJ1wiXT8pKFteJ1wiKV0rKVxcMVxcKS9nLCAoX20sIHEsIHApID0+IGB1cmwoJHtxfSR7dG9DRE4ocCwgY2RuKX0ke3F9KWApO1xuXG4gIGNvbnN0IHJld3JpdGVKc3hBc3QgPSAoY29kZTogc3RyaW5nLCBpZDogc3RyaW5nLCBjZG46IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGFzdCA9IHBhcnNlKGNvZGUsIHsgc291cmNlVHlwZTogJ21vZHVsZScsIHBsdWdpbnM6IFsndHlwZXNjcmlwdCcsICdqc3gnXSB9KTtcbiAgICBsZXQgcmV3cml0ZXMgPSAwO1xuXG4gICAgdHJhdmVyc2UoYXN0LCB7XG4gICAgICBKU1hBdHRyaWJ1dGUocGF0aCkge1xuICAgICAgICBjb25zdCBuYW1lID0gKHBhdGgubm9kZS5uYW1lIGFzIHQuSlNYSWRlbnRpZmllcikubmFtZTtcbiAgICAgICAgY29uc3QgaXNTcmMgPSBuYW1lID09PSAnc3JjJyB8fCBuYW1lID09PSAnaHJlZic7XG4gICAgICAgIGNvbnN0IGlzU3JjU2V0ID0gbmFtZSA9PT0gJ3NyY1NldCcgfHwgbmFtZSA9PT0gJ3NyY3NldCc7XG4gICAgICAgIGlmICghaXNTcmMgJiYgIWlzU3JjU2V0KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdmFsID0gcGF0aC5ub2RlLnZhbHVlO1xuICAgICAgICBpZiAoIXZhbCkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0LmlzU3RyaW5nTGl0ZXJhbCh2YWwpKSB7XG4gICAgICAgICAgY29uc3QgYmVmb3JlID0gdmFsLnZhbHVlO1xuICAgICAgICAgIHZhbC52YWx1ZSA9IGlzU3JjID8gdG9DRE4odmFsLnZhbHVlLCBjZG4pIDogcmV3cml0ZVNyY3NldExpc3QodmFsLnZhbHVlLCBjZG4pO1xuICAgICAgICAgIGlmICh2YWwudmFsdWUgIT09IGJlZm9yZSkgcmV3cml0ZXMrKztcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQuaXNKU1hFeHByZXNzaW9uQ29udGFpbmVyKHZhbCkgJiYgdC5pc1N0cmluZ0xpdGVyYWwodmFsLmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgY29uc3QgYmVmb3JlID0gdmFsLmV4cHJlc3Npb24udmFsdWU7XG4gICAgICAgICAgdmFsLmV4cHJlc3Npb24udmFsdWUgPSBpc1NyY1xuICAgICAgICAgICAgPyB0b0NETih2YWwuZXhwcmVzc2lvbi52YWx1ZSwgY2RuKVxuICAgICAgICAgICAgOiByZXdyaXRlU3Jjc2V0TGlzdCh2YWwuZXhwcmVzc2lvbi52YWx1ZSwgY2RuKTtcbiAgICAgICAgICBpZiAodmFsLmV4cHJlc3Npb24udmFsdWUgIT09IGJlZm9yZSkgcmV3cml0ZXMrKztcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgU3RyaW5nTGl0ZXJhbChwYXRoKSB7XG4gICAgICAgIC8vIHNraXAgb2JqZWN0IGtleXM6IHsgXCJpbWFnZVwiOiBcIi4uLlwiIH1cbiAgICAgICAgaWYgKHQuaXNPYmplY3RQcm9wZXJ0eShwYXRoLnBhcmVudCkgJiYgcGF0aC5wYXJlbnRLZXkgPT09ICdrZXknICYmICFwYXRoLnBhcmVudC5jb21wdXRlZCkgcmV0dXJuO1xuICAgICAgICAvLyBza2lwIGltcG9ydC9leHBvcnQgc291cmNlc1xuICAgICAgICBpZiAodC5pc0ltcG9ydERlY2xhcmF0aW9uKHBhdGgucGFyZW50KSB8fCB0LmlzRXhwb3J0QWxsRGVjbGFyYXRpb24ocGF0aC5wYXJlbnQpIHx8IHQuaXNFeHBvcnROYW1lZERlY2xhcmF0aW9uKHBhdGgucGFyZW50KSkgcmV0dXJuO1xuICAgICAgICAvLyBza2lwIGluc2lkZSBKU1ggYXR0cmlidXRlIChhbHJlYWR5IGhhbmRsZWQpXG4gICAgICAgIGlmIChwYXRoLmZpbmRQYXJlbnQocCA9PiBwLmlzSlNYQXR0cmlidXRlKCkpKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgYmVmb3JlID0gcGF0aC5ub2RlLnZhbHVlO1xuICAgICAgICBjb25zdCBhZnRlciA9IHRvQ0ROKGJlZm9yZSwgY2RuKTtcbiAgICAgICAgaWYgKGFmdGVyICE9PSBiZWZvcmUpIHsgcGF0aC5ub2RlLnZhbHVlID0gYWZ0ZXI7IHJld3JpdGVzKys7IH1cbiAgICAgIH0sXG5cbiAgICAgIFRlbXBsYXRlTGl0ZXJhbChwYXRoKSB7XG4gICAgICAgIC8vIGhhbmRsZSBgXCIvaW1hZ2VzL2Zvby5wbmdcImAgYXMgdGVtcGxhdGUgd2l0aCBOTyBleHByZXNzaW9uc1xuICAgICAgICBpZiAocGF0aC5ub2RlLmV4cHJlc3Npb25zLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBjb25zdCByYXcgPSBwYXRoLm5vZGUucXVhc2lzLm1hcChxID0+IHEudmFsdWUuY29va2VkID8/IHEudmFsdWUucmF3KS5qb2luKCcnKTtcbiAgICAgICAgY29uc3QgYWZ0ZXIgPSB0b0NETihyYXcsIGNkbik7XG4gICAgICAgIGlmIChhZnRlciAhPT0gcmF3KSB7XG4gICAgICAgICAgcGF0aC5yZXBsYWNlV2l0aCh0LnN0cmluZ0xpdGVyYWwoYWZ0ZXIpKTtcbiAgICAgICAgICByZXdyaXRlcysrO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBpZiAoIXJld3JpdGVzKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBvdXQgPSBnZW5lcmF0ZShhc3QsIHsgcmV0YWluTGluZXM6IHRydWUsIHNvdXJjZU1hcHM6IGZhbHNlIH0sIGNvZGUpLmNvZGU7XG4gICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZyhgW2Nkbl0gJHtpZH0gXHUyMTkyICR7cmV3cml0ZXN9IHJld3JpdGVzYCk7XG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICBhc3luYyBmdW5jdGlvbiBjb2xsZWN0UHVibGljSW1hZ2VzRnJvbShkaXI6IHN0cmluZykge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbGxlY3QgZXZlcnkgZmlsZSB1bmRlciBwdWJsaWMvaW1hZ2VzIGludG8gaW1hZ2VTZXQgYXMgJy9pbWFnZXMvcmVscGF0aCdcbiAgICBjb25zdCBpbWFnZXNEaXIgPSBub2RlUGF0aC5qb2luKGRpciwgJ2ltYWdlcycpO1xuICAgIGNvbnN0IHN0YWNrID0gW2ltYWdlc0Rpcl07XG4gICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgY29uc3QgY3VyID0gc3RhY2sucG9wKCkhO1xuICAgICAgbGV0IGVudHJpZXM6IGFueVtdID0gW107XG4gICAgICB0cnkge1xuICAgICAgICBlbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpcihjdXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBjb250aW51ZTsgLy8gaW1hZ2VzLyBtYXkgbm90IGV4aXN0XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGVudCBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IGZ1bGwgPSBub2RlUGF0aC5qb2luKGN1ciwgZW50Lm5hbWUpO1xuICAgICAgICBpZiAoZW50LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBzdGFjay5wdXNoKGZ1bGwpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudC5pc0ZpbGUoKSkge1xuICAgICAgICAgIGNvbnN0IHJlbCA9IG5vZGVQYXRoLnJlbGF0aXZlKGRpciwgZnVsbCkuc3BsaXQobm9kZVBhdGguc2VwKS5qb2luKCcvJyk7XG4gICAgICAgICAgY29uc3QgY2Fub25pY2FsID0gJy8nICsgcmVsOyAvLyAnL2ltYWdlcy8uLi4nXG4gICAgICAgICAgaW1hZ2VTZXQuYWRkKGNhbm9uaWNhbCk7XG4gICAgICAgICAgLy8gYWxzbyBhZGQgdmFyaWFudCB3aXRob3V0IGxlYWRpbmcgc2xhc2ggZm9yIHNhZmV0eVxuICAgICAgICAgIGltYWdlU2V0LmFkZChjYW5vbmljYWwuc2xpY2UoMSkpOyAvLyAnaW1hZ2VzLy4uLidcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2Nkbi1wcmVmaXgtaW1hZ2VzLWV4aXN0aW5nJyxcbiAgICBhcHBseTogJ2J1aWxkJyxcbiAgICBlbmZvcmNlOiAncHJlJywgLy8gcnVuIGJlZm9yZSBAdml0ZWpzL3BsdWdpbi1yZWFjdFxuXG4gICAgY29uZmlnUmVzb2x2ZWQoY2ZnKSB7XG4gICAgICBwdWJsaWNEaXIgPSBjZmcucHVibGljRGlyOyAvLyBhYnNvbHV0ZVxuICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZygnW2Nkbl0gcHVibGljRGlyID0nLCBwdWJsaWNEaXIpO1xuICAgIH0sXG5cbiAgICBhc3luYyBidWlsZFN0YXJ0KCkge1xuICAgICAgYXdhaXQgY29sbGVjdFB1YmxpY0ltYWdlc0Zyb20ocHVibGljRGlyKTtcbiAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coJ1tjZG5dIGltYWdlcyBmb3VuZDonLCBpbWFnZVNldC5zaXplKTtcbiAgICB9LFxuXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcbiAgICAgIGNvbnN0IGNkbiA9IHByb2Nlc3MuZW52LkNETl9JTUdfUFJFRklYO1xuICAgICAgaWYgKCFjZG4pIHJldHVybiBodG1sO1xuICAgICAgY29uc3Qgb3V0ID0gcmV3cml0ZUh0bWwoaHRtbCwgY2RuKTtcbiAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coJ1tjZG5dIHRyYW5zZm9ybUluZGV4SHRtbCBkb25lJyk7XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH0sXG5cbiAgICB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcbiAgICAgIGNvbnN0IGNkbiA9IHByb2Nlc3MuZW52LkNETl9JTUdfUFJFRklYO1xuICAgICAgaWYgKCFjZG4pIHJldHVybiBudWxsO1xuXG4gICAgICBpZiAoL1xcLihqc3h8dHN4KSQvLnRlc3QoaWQpKSB7XG4gICAgICAgIGNvbnN0IG91dCA9IHJld3JpdGVKc3hBc3QoY29kZSwgaWQsIGNkbik7XG4gICAgICAgIHJldHVybiBvdXQgPyB7IGNvZGU6IG91dCwgbWFwOiBudWxsIH0gOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoL1xcLihjc3N8c2Nzc3xzYXNzfGxlc3N8c3R5bCkkL2kudGVzdChpZCkpIHtcbiAgICAgICAgY29uc3Qgb3V0ID0gcmV3cml0ZUNzc1VybHMoY29kZSwgY2RuKTtcbiAgICAgICAgcmV0dXJuIG91dCA9PT0gY29kZSA/IG51bGwgOiB7IGNvZGU6IG91dCwgbWFwOiBudWxsIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gIH07XG59XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA4MDgwLFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiZcbiAgICAgIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgICAgY2RuUHJlZml4SW1hZ2VzKCksXG4gICAgXS5maWx0ZXIoQm9vbGVhbiksXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICAgIC8vIFByb3h5IHJlYWN0LXJvdXRlci1kb20gdG8gb3VyIHdyYXBwZXJcbiAgICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvbGliL3JlYWN0LXJvdXRlci1kb20tcHJveHkudHN4XCIpLFxuICAgICAgICAvLyBPcmlnaW5hbCByZWFjdC1yb3V0ZXItZG9tIHVuZGVyIGEgZGlmZmVyZW50IG5hbWVcbiAgICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tLW9yaWdpbmFsXCI6IFwicmVhY3Qtcm91dGVyLWRvbVwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGRlZmluZToge1xuICAgICAgLy8gRGVmaW5lIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgYnVpbGQtdGltZSBjb25maWd1cmF0aW9uXG4gICAgICAvLyBJbiBwcm9kdWN0aW9uLCB0aGlzIHdpbGwgYmUgZmFsc2UgYnkgZGVmYXVsdCB1bmxlc3MgZXhwbGljaXRseSBzZXQgdG8gJ3RydWUnXG4gICAgICAvLyBJbiBkZXZlbG9wbWVudCBhbmQgdGVzdCwgdGhpcyB3aWxsIGJlIHRydWUgYnkgZGVmYXVsdFxuICAgICAgX19ST1VURV9NRVNTQUdJTkdfRU5BQkxFRF9fOiBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nXG4gICAgICAgICAgPyBwcm9jZXNzLmVudi5WSVRFX0VOQUJMRV9ST1VURV9NRVNTQUdJTkcgPT09ICd0cnVlJ1xuICAgICAgICAgIDogcHJvY2Vzcy5lbnYuVklURV9FTkFCTEVfUk9VVEVfTUVTU0FHSU5HICE9PSAnZmFsc2UnXG4gICAgICApLFxuICAgIH0sXG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsb0JBQWlDO0FBQzFDLE9BQU8sV0FBVztBQUNsQixPQUFPLFFBQVE7QUFDZixPQUFPLGNBQWM7QUFDckIsU0FBUyx1QkFBdUI7QUFDaEMsT0FBTyxVQUFVO0FBRWpCLFNBQVMsYUFBYTtBQUN0QixPQUFPLGVBQWU7QUFDdEIsT0FBTyxlQUFlO0FBQ3RCLFlBQVksT0FBTztBQVpuQixJQUFNLG1DQUFtQztBQWdCekMsSUFBTSxXQUF1QyxVQUFrQixXQUFXO0FBQzFFLElBQU0sV0FBdUMsVUFBa0IsV0FBVztBQUUxRSxTQUFTLGtCQUEwQjtBQUNqQyxRQUFNLFFBQVEsUUFBUSxJQUFJLGtCQUFrQjtBQUM1QyxNQUFJLFlBQVk7QUFDaEIsUUFBTSxXQUFXLG9CQUFJLElBQVk7QUFFakMsUUFBTSxhQUFhLENBQUMsTUFDbEIscUJBQXFCLEtBQUssQ0FBQyxLQUFLLEVBQUUsV0FBVyxPQUFPLEtBQUssRUFBRSxXQUFXLE9BQU87QUFHL0UsUUFBTSxlQUFlLENBQUMsTUFBYztBQUNsQyxRQUFJLElBQUksRUFBRSxLQUFLO0FBRWYsUUFBSSxXQUFXLENBQUMsRUFBRyxRQUFPO0FBRTFCLFFBQUksRUFBRSxRQUFRLFlBQVksRUFBRTtBQUM1QixXQUFPLEVBQUUsV0FBVyxLQUFLLEVBQUcsS0FBSSxFQUFFLE1BQU0sQ0FBQztBQUN6QyxRQUFJLEVBQUUsV0FBVyxHQUFHLEVBQUcsS0FBSSxFQUFFLE1BQU0sQ0FBQztBQUVwQyxRQUFJLENBQUMsRUFBRSxXQUFXLFNBQVMsRUFBRyxRQUFPO0FBQ3JDLFdBQU8sTUFBTTtBQUFBLEVBQ2Y7QUFFQSxRQUFNLFFBQVEsQ0FBQyxHQUFXLFFBQWdCO0FBQ3hDLFVBQU0sSUFBSSxhQUFhLENBQUM7QUFDeEIsUUFBSSxXQUFXLENBQUMsRUFBRyxRQUFPO0FBQzFCLFFBQUksQ0FBQyxFQUFFLFdBQVcsVUFBVSxFQUFHLFFBQU87QUFDdEMsUUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLEVBQUcsUUFBTztBQUM3QixVQUFNLE9BQU8sSUFBSSxTQUFTLEdBQUcsSUFBSSxNQUFNLE1BQU07QUFDN0MsV0FBTyxPQUFPLEVBQUUsTUFBTSxDQUFDO0FBQUEsRUFDekI7QUFFQSxRQUFNLG9CQUFvQixDQUFDLE9BQWUsUUFDeEMsTUFDRyxNQUFNLEdBQUcsRUFDVCxJQUFJLENBQUMsU0FBUztBQUNiLFVBQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUM5QyxVQUFNLE1BQU0sTUFBTSxLQUFLLEdBQUc7QUFDMUIsV0FBTyxPQUFPLEdBQUcsR0FBRyxJQUFJLElBQUksS0FBSztBQUFBLEVBQ25DLENBQUMsRUFDQSxLQUFLLElBQUk7QUFFZCxRQUFNLGNBQWMsQ0FBQyxNQUFjLFFBQWdCO0FBRWpELFdBQU8sS0FBSztBQUFBLE1BQ1Y7QUFBQSxNQUNBLENBQUMsSUFBSSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFBQSxJQUNoRDtBQUVBLFdBQU8sS0FBSztBQUFBLE1BQ1Y7QUFBQSxNQUNBLENBQUMsSUFBSSxHQUFHLEdBQUcsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsa0JBQWtCLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUFBLElBQ2xFO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLGlCQUFpQixDQUFDLE1BQWMsUUFDcEMsS0FBSyxRQUFRLDhCQUE4QixDQUFDLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUc7QUFFMUYsUUFBTSxnQkFBZ0IsQ0FBQyxNQUFjLElBQVksUUFBZ0I7QUFDL0QsVUFBTSxNQUFNLE1BQU0sTUFBTSxFQUFFLFlBQVksVUFBVSxTQUFTLENBQUMsY0FBYyxLQUFLLEVBQUUsQ0FBQztBQUNoRixRQUFJLFdBQVc7QUFFZixhQUFTLEtBQUs7QUFBQSxNQUNaLGFBQWFBLE9BQU07QUFDakIsY0FBTSxPQUFRQSxNQUFLLEtBQUssS0FBeUI7QUFDakQsY0FBTSxRQUFRLFNBQVMsU0FBUyxTQUFTO0FBQ3pDLGNBQU0sV0FBVyxTQUFTLFlBQVksU0FBUztBQUMvQyxZQUFJLENBQUMsU0FBUyxDQUFDLFNBQVU7QUFFekIsY0FBTSxNQUFNQSxNQUFLLEtBQUs7QUFDdEIsWUFBSSxDQUFDLElBQUs7QUFFVixZQUFNLGtCQUFnQixHQUFHLEdBQUc7QUFDMUIsZ0JBQU0sU0FBUyxJQUFJO0FBQ25CLGNBQUksUUFBUSxRQUFRLE1BQU0sSUFBSSxPQUFPLEdBQUcsSUFBSSxrQkFBa0IsSUFBSSxPQUFPLEdBQUc7QUFDNUUsY0FBSSxJQUFJLFVBQVUsT0FBUTtBQUMxQjtBQUFBLFFBQ0Y7QUFDQSxZQUFNLDJCQUF5QixHQUFHLEtBQU8sa0JBQWdCLElBQUksVUFBVSxHQUFHO0FBQ3hFLGdCQUFNLFNBQVMsSUFBSSxXQUFXO0FBQzlCLGNBQUksV0FBVyxRQUFRLFFBQ25CLE1BQU0sSUFBSSxXQUFXLE9BQU8sR0FBRyxJQUMvQixrQkFBa0IsSUFBSSxXQUFXLE9BQU8sR0FBRztBQUMvQyxjQUFJLElBQUksV0FBVyxVQUFVLE9BQVE7QUFBQSxRQUN2QztBQUFBLE1BQ0Y7QUFBQSxNQUVBLGNBQWNBLE9BQU07QUFFbEIsWUFBTSxtQkFBaUJBLE1BQUssTUFBTSxLQUFLQSxNQUFLLGNBQWMsU0FBUyxDQUFDQSxNQUFLLE9BQU8sU0FBVTtBQUUxRixZQUFNLHNCQUFvQkEsTUFBSyxNQUFNLEtBQU8seUJBQXVCQSxNQUFLLE1BQU0sS0FBTywyQkFBeUJBLE1BQUssTUFBTSxFQUFHO0FBRTVILFlBQUlBLE1BQUssV0FBVyxPQUFLLEVBQUUsZUFBZSxDQUFDLEVBQUc7QUFFOUMsY0FBTSxTQUFTQSxNQUFLLEtBQUs7QUFDekIsY0FBTSxRQUFRLE1BQU0sUUFBUSxHQUFHO0FBQy9CLFlBQUksVUFBVSxRQUFRO0FBQUUsVUFBQUEsTUFBSyxLQUFLLFFBQVE7QUFBTztBQUFBLFFBQVk7QUFBQSxNQUMvRDtBQUFBLE1BRUEsZ0JBQWdCQSxPQUFNO0FBRXBCLFlBQUlBLE1BQUssS0FBSyxZQUFZLE9BQVE7QUFDbEMsY0FBTSxNQUFNQSxNQUFLLEtBQUssT0FBTyxJQUFJLE9BQUssRUFBRSxNQUFNLFVBQVUsRUFBRSxNQUFNLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDNUUsY0FBTSxRQUFRLE1BQU0sS0FBSyxHQUFHO0FBQzVCLFlBQUksVUFBVSxLQUFLO0FBQ2pCLFVBQUFBLE1BQUssWUFBYyxnQkFBYyxLQUFLLENBQUM7QUFDdkM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBRUYsQ0FBQztBQUVELFFBQUksQ0FBQyxTQUFVLFFBQU87QUFDdEIsVUFBTSxNQUFNLFNBQVMsS0FBSyxFQUFFLGFBQWEsTUFBTSxZQUFZLE1BQU0sR0FBRyxJQUFJLEVBQUU7QUFDMUUsUUFBSSxNQUFPLFNBQVEsSUFBSSxTQUFTLEVBQUUsV0FBTSxRQUFRLFdBQVc7QUFDM0QsV0FBTztBQUFBLEVBQ1Q7QUFFQSxpQkFBZSx3QkFBd0IsS0FBYTtBQUVsRCxVQUFNLFlBQVksU0FBUyxLQUFLLEtBQUssUUFBUTtBQUM3QyxVQUFNLFFBQVEsQ0FBQyxTQUFTO0FBQ3hCLFdBQU8sTUFBTSxRQUFRO0FBQ25CLFlBQU0sTUFBTSxNQUFNLElBQUk7QUFDdEIsVUFBSSxVQUFpQixDQUFDO0FBQ3RCLFVBQUk7QUFDRixrQkFBVSxNQUFNLEdBQUcsUUFBUSxLQUFLLEVBQUUsZUFBZSxLQUFLLENBQUM7QUFBQSxNQUN6RCxRQUFRO0FBQ047QUFBQSxNQUNGO0FBQ0EsaUJBQVcsT0FBTyxTQUFTO0FBQ3pCLGNBQU0sT0FBTyxTQUFTLEtBQUssS0FBSyxJQUFJLElBQUk7QUFDeEMsWUFBSSxJQUFJLFlBQVksR0FBRztBQUNyQixnQkFBTSxLQUFLLElBQUk7QUFBQSxRQUNqQixXQUFXLElBQUksT0FBTyxHQUFHO0FBQ3ZCLGdCQUFNLE1BQU0sU0FBUyxTQUFTLEtBQUssSUFBSSxFQUFFLE1BQU0sU0FBUyxHQUFHLEVBQUUsS0FBSyxHQUFHO0FBQ3JFLGdCQUFNLFlBQVksTUFBTTtBQUN4QixtQkFBUyxJQUFJLFNBQVM7QUFFdEIsbUJBQVMsSUFBSSxVQUFVLE1BQU0sQ0FBQyxDQUFDO0FBQUEsUUFDakM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxTQUFTO0FBQUE7QUFBQSxJQUVULGVBQWUsS0FBSztBQUNsQixrQkFBWSxJQUFJO0FBQ2hCLFVBQUksTUFBTyxTQUFRLElBQUkscUJBQXFCLFNBQVM7QUFBQSxJQUN2RDtBQUFBLElBRUEsTUFBTSxhQUFhO0FBQ2pCLFlBQU0sd0JBQXdCLFNBQVM7QUFDdkMsVUFBSSxNQUFPLFNBQVEsSUFBSSx1QkFBdUIsU0FBUyxJQUFJO0FBQUEsSUFDN0Q7QUFBQSxJQUVBLG1CQUFtQixNQUFNO0FBQ3ZCLFlBQU0sTUFBTSxRQUFRLElBQUk7QUFDeEIsVUFBSSxDQUFDLElBQUssUUFBTztBQUNqQixZQUFNLE1BQU0sWUFBWSxNQUFNLEdBQUc7QUFDakMsVUFBSSxNQUFPLFNBQVEsSUFBSSwrQkFBK0I7QUFDdEQsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUVBLFVBQVUsTUFBTSxJQUFJO0FBQ2xCLFlBQU0sTUFBTSxRQUFRLElBQUk7QUFDeEIsVUFBSSxDQUFDLElBQUssUUFBTztBQUVqQixVQUFJLGVBQWUsS0FBSyxFQUFFLEdBQUc7QUFDM0IsY0FBTSxNQUFNLGNBQWMsTUFBTSxJQUFJLEdBQUc7QUFDdkMsZUFBTyxNQUFNLEVBQUUsTUFBTSxLQUFLLEtBQUssS0FBSyxJQUFJO0FBQUEsTUFDMUM7QUFFQSxVQUFJLGdDQUFnQyxLQUFLLEVBQUUsR0FBRztBQUM1QyxjQUFNLE1BQU0sZUFBZSxNQUFNLEdBQUc7QUFDcEMsZUFBTyxRQUFRLE9BQU8sT0FBTyxFQUFFLE1BQU0sS0FBSyxLQUFLLEtBQUs7QUFBQSxNQUN0RDtBQUVBLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUNGO0FBR0EsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsTUFDaEIsZ0JBQWdCO0FBQUEsSUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxJQUNoQixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUE7QUFBQSxRQUVwQyxvQkFBb0IsS0FBSyxRQUFRLGtDQUFXLHNDQUFzQztBQUFBO0FBQUEsUUFFbEYsNkJBQTZCO0FBQUEsTUFDL0I7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFJTiw2QkFBNkIsS0FBSztBQUFBLFFBQ2hDLFNBQVMsZUFDTCxRQUFRLElBQUksZ0NBQWdDLFNBQzVDLFFBQVEsSUFBSSxnQ0FBZ0M7QUFBQSxNQUNsRDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
