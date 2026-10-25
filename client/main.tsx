import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, useLocation } from "react-router-dom";
import {
  useEffect,
  useState,
  Component,
  lazy,
  Suspense,
  type ReactNode,
} from "react";
import { ViewContext } from "./view";
import type { ViewData } from "./types";
import Navigation from "../components/navigation";
const Home = lazy(() => import("./pages/home"));
const Section = lazy(() => import("./pages/section"));
const Detail = lazy(() => import("./pages/detail"));
const Activities = lazy(() => import("./pages/activities"));
const Search = lazy(() => import("./pages/search"));
const Admin = lazy(() => import("./pages/admin"));
import "./styles.css";
const initialElement = document.getElementById("page-data");
const initial: ViewData | null = initialElement?.textContent
  ? JSON.parse(initialElement.textContent)
  : null;
const initialPath = window.location.pathname + window.location.search;
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main id="main" className="page-width section">
        <h1>Unable to display this page.</h1>
        <a href={window.location.href}>Reload page</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Application() {
  const location = useLocation();
  const path = location.pathname + location.search;
  const [view, setView] = useState<ViewData | null>(initial);
  const [loaded, setLoaded] = useState(initial ? initialPath : "");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener("jcts:refresh", refresh);
    return () => window.removeEventListener("jcts:refresh", refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch(`/api/view?path=${encodeURIComponent(path)}`, {
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Unable to load page");
        setView(data);
        setLoaded(path);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Unable to load page");
      });
    return () => controller.abort();
  }, [path, revision]);
  useEffect(() => {
    if (!view) return;
    document.title = `${view.title} | IEEE JCTS Pune`;
    const update = (name: string, value: string) => {
      let node = document.head.querySelector<HTMLMetaElement>(
        `meta[name="${name}"]`,
      );
      if (!node) {
        node = document.createElement("meta");
        node.name = name;
        document.head.append(node);
      }
      node.content = value;
    };
    update("description", view.description);
    update(
      "robots",
      view.page === "admin" ||
        view.page === "login" ||
        view.page === "search" ||
        view.query.preview
        ? "noindex,nofollow"
        : "index,follow",
    );
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = new URL(view.canonical, view.siteUrl).href;
  }, [view]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  if (error)
    return (
      <main id="main" className="page-width section">
        <h1>Unable to load the website</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={() => setRevision((n) => n + 1)}>
          Try again
        </button>
      </main>
    );
  if (!view || loaded !== path)
    return (
      <main id="main" className="page-width section" aria-busy="true">
        <p role="status">Loading…</p>
      </main>
    );
  if (view.redirect) return <Navigate to={view.redirect} replace />;
  const content =
    view.page === "home" ? (
      <Home />
    ) : view.page === "section" ? (
      <Section />
    ) : view.page === "detail" ? (
      <Detail />
    ) : view.page === "activities" ? (
      <Activities />
    ) : view.page === "search" ? (
      <Search />
    ) : view.page === "admin" || view.page === "login" ? (
      <Admin />
    ) : (
      <main id="main" className="page-width section">
        <p className="eyebrow">404 / A DIFFERENT DIRECTION</p>
        <h1>Let’s reconnect.</h1>
        <p>This page may have moved or is not published yet.</p>
        <a href="/" className="button">
          Back to the chapter
        </a>
      </main>
    );
  return (
    <ViewContext.Provider value={view}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navigation items={view.navigation} />
      <Boundary key={location.pathname}>
        <Suspense
          fallback={
            <main id="main" className="page-width section">
              <p role="status">Loading...</p>
            </main>
          }
        >
          {content}
        </Suspense>
      </Boundary>
    </ViewContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Application />
  </BrowserRouter>,
);
