/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
declare module "*.css";

interface Window {
  ahoy: import("./core/appState/agentBridge.ts").AgentBridge;
}
