import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/geist-mono/500.css";
import "./tokens.css";
import { createRoot } from "react-dom/client";
import { AgentApp } from "./agentApp.tsx";
import { ErrorBoundary } from "./components/errorBoundary.tsx";
import { PopoverApp } from "./popover/popoverApp.tsx";

const surface = new URLSearchParams(window.location.search).get("surface");
document.body.dataset.surface = surface ?? "window";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      {surface === "popover" ? <PopoverApp /> : <AgentApp />}
    </ErrorBoundary>,
  );
}
