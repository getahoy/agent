/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
declare module "*.css";

interface ImportMeta {
  readonly env: Readonly<Record<string, unknown>>;
}

interface Window {
  ahoy: import("./core/appState/agentBridge.ts").AgentBridge;
}
