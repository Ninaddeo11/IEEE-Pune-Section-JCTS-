import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pageHtml } from "./server/html";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "backend-page-data",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathname = new URL(req.url || "/", "http://localhost").pathname;
          if (
            req.method !== "GET" ||
            /^\/(api|uploads|@|client|components|lib|node_modules|assets)/.test(
              pathname,
            ) ||
            /\.[a-z0-9]+$/i.test(pathname)
          )
            return next();
          try {
            const response = await fetch(
              `http://127.0.0.1:${process.env.API_PORT || 4000}/api/view?path=${encodeURIComponent(req.url || "/")}`,
              {
                headers: req.headers.cookie
                  ? { cookie: req.headers.cookie }
                  : {},
              },
            );
            if (!response.ok) {
              res.statusCode = 502;
              res.end("Backend unavailable");
              return;
            }
            const view = await response.json();
            if (view.redirect) {
              res.statusCode = view.status === 301 ? 301 : 302;
              res.setHeader("Location", view.redirect);
              res.end();
              return;
            }
            const template = await readFile("index.html", "utf8");
            const html = await server.transformIndexHtml(
              req.url || "/",
              pageHtml(template, view),
            );
            res.statusCode = view.status;
            res.setHeader("Content-Type", "text/html");
            res.setHeader("Cache-Control", "no-store");
            res.end(html);
          } catch {
            res.statusCode = 502;
            res.end("Backend unavailable. Start the API server.");
          }
        });
      },
    },
  ],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.WEB_PORT || 3000),
    strictPort: true,
    proxy: Object.fromEntries(
      [
        "/api",
        "/uploads",
        "/sitemap.xml",
        "/robots.txt",
        "/opengraph-image",
      ].map((prefix) => [
        prefix,
        {
          target: `http://127.0.0.1:${process.env.API_PORT || 4000}`,
          changeOrigin: false,
        },
      ]),
    ),
  },
  build: { outDir: "dist/client", emptyOutDir: true },
});
