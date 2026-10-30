import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/geist-mono/500.css";
import "./tokens.css";
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AgentApp } from "./agentApp.tsx";
import { ErrorBoundary } from "./components/errorBoundary.tsx";
import { PopoverApp } from "./popover/popoverApp.tsx";

const surface = new URLSearchParams(window.location.search).get("surface");
document.body.dataset.surface = surface ?? "window";

const GalleryApp = import.meta.env.DEV
  ? lazy(() =>
      import("./gallery/galleryApp.tsx").then((module) => ({
        default: module.GalleryApp,
      })),
    )
  : null;

function SurfaceApp() {
  if (surface === "popover") return <PopoverApp />;
  if (surface === "gallery" && GalleryApp) {
    return (
      <Suspense>
        <GalleryApp />
      </Suspense>
    );
  }
  return <AgentApp />;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <SurfaceApp />
    </ErrorBoundary>,
  );
}
