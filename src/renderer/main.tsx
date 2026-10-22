import "./tokens.css";
import { createRoot } from "react-dom/client";
import { AgentApp } from "./agentApp.tsx";
import { ErrorBoundary } from "./components/errorBoundary.tsx";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <AgentApp />
    </ErrorBoundary>,
  );
}
