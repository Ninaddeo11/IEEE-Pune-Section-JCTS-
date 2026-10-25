import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requests } from "./context";
import { buildView } from "./view";
import { pageHtml } from "./html";
import { entries } from "../lib/db";
import { publicCollection } from "../lib/content";
import * as homepageLayout from "./routes/homepage-layout";
import * as auth from "./routes/auth";
import * as content from "./routes/content";
import * as media from "./routes/media";
import * as users from "./routes/users";
import * as contact from "./routes/contact";
import * as messages from "./routes/messages";
import * as preview from "./routes/preview";
import * as revisions from "./routes/revisions";
import * as account from "./routes/account";
type Handler = (request: Request) => Promise<Response>;
const routes: Record<string, Record<string, Handler>> = {
  "homepage-layout": homepageLayout,
  auth,
  content,
  media,
  users,
  contact,
  messages,
  preview,
  revisions,
  account,
};
export const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; font-src 'self'; connect-src 'self'${process.env.NODE_ENV === "production" ? "" : " ws: wss:"}; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`,
  );
  next();
});
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", express.raw({ type: () => true, limit: "27mb" }));
app.use(async (req, res, next) => {
  if (
    !req.path.startsWith("/api/") &&
    !req.path.endsWith(".xml") &&
    !req.path.endsWith(".txt") &&
    req.path !== "/opengraph-image" &&
    process.env.NODE_ENV !== "production"
  )
    return next();
  const base =
    process.env.NODE_ENV === "production"
      ? process.env.SITE_URL || `${req.protocol}://${req.get("host")}`
      : `${req.protocol}://${req.get("host")}`;
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers))
    if (value)
      headers.set(name, Array.isArray(value) ? value.join(",") : value);
  const request = new Request(new URL(req.originalUrl, base), {
    method: req.method,
    headers,
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: req.body?.length ? new Uint8Array(req.body) : undefined }
      : {}),
  });
  const context = { request, setCookies: [] as string[] };
  await requests.run(context, async () => {
    try {
      let response: Response;
      if (req.path === "/api/view") {
        const requested = new URL(request.url).searchParams.get("path") || "/";
        if (!requested.startsWith("/") || requested.startsWith("//")) {
          res.status(400).json({ error: "Invalid page path" });
          return;
        }
        response = Response.json(await buildView(requested), {
          headers: { "Cache-Control": "no-store" },
        });
      } else if (req.path.startsWith("/api/")) {
        const handler = routes[req.path.slice(5)]?.[req.method];
        response = handler
          ? await handler(request)
          : Response.json(
              { error: "Endpoint or method not found" },
              { status: 404 },
            );
      } else if (req.path === "/robots.txt") {
        response = new Response(
          `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /*?preview=\nSitemap: ${base}/sitemap.xml\n`,
          { headers: { "Content-Type": "text/plain" } },
        );
      } else if (req.path === "/sitemap.xml") {
        const all = await entries();
        const urls = new Set([
          "/",
          "/upcoming",
          "/about",
          "/membership",
          "/contact",
          ...all
            .filter((e) => e.collection === "pages")
            .map((e) => `/${e.slug}`),
          ...all
            .filter((e) =>
              [
                "activities",
                "leadership",
                "research",
                "publications",
                "opportunities",
                "resources",
                "news",
                "gallery",
              ].includes(publicCollection(e.collection)),
            )
            .flatMap((e) => [
              `/${publicCollection(e.collection)}`,
              `/${publicCollection(e.collection)}/${e.slug}`,
            ]),
        ]);
        response = new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].map((url) => `<url><loc>${new URL(url, base).href.replace(/&/g, "&amp;")}</loc></url>`).join("")}</urlset>`,
          { headers: { "Content-Type": "application/xml" } },
        );
      } else if (req.path === "/opengraph-image") {
        response = new Response(
          await readFile(
            path.resolve(
              process.env.NODE_ENV === "production"
                ? "dist/client/social-card.png"
                : "public/social-card.png",
            ),
          ),
          { headers: { "Content-Type": "image/png" } },
        );
      } else {
        return next();
      }
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (context.setCookies.length)
        res.setHeader("Set-Cookie", context.setCookies);
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.status(500).json({
        error: "Unable to load data. Check the server and database connection.",
      });
    }
  });
});
app.use(
  "/uploads",
  express.static(path.resolve("public/uploads"), { dotfiles: "deny" }),
);
app.use(express.static(path.resolve("dist/client"), { index: false }));
app.get("/{*path}", async (req, res) => {
  const base =
    process.env.NODE_ENV === "production"
      ? process.env.SITE_URL || `${req.protocol}://${req.get("host")}`
      : `${req.protocol}://${req.get("host")}`;
  const request = new Request(new URL(req.originalUrl, base), {
    headers: new Headers(
      Object.entries(req.headers).filter(
        (e): e is [string, string] => typeof e[1] === "string",
      ),
    ),
  });
  await requests.run({ request, setCookies: [] }, async () => {
    try {
      const view = await buildView(req.originalUrl);
      if (view.redirect) {
        res.redirect(view.status === 301 ? 301 : 302, view.redirect);
        return;
      }
      const html = await readFile(
        path.resolve("dist/client/index.html"),
        "utf8",
      );
      res.setHeader("Cache-Control", "no-store");
      res.status(view.status).type("html").send(pageHtml(html, view));
    } catch {
      res
        .status(500)
        .send("Unable to load the website. Check the backend connection.");
    }
  });
});
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    void error;
    void _next;
    res.status(400).json({ error: "Invalid request or upload too large" });
  },
);
export default app;
