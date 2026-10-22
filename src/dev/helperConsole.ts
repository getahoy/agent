import { spawn } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";
import { HelperClient } from "../core/helper/helperClient.ts";
import { macosHelperBinary } from "../platform/macos/helperBinary.ts";
import { runCommand } from "./consoleCommands.ts";

const REQUEST_TIMEOUT_MS = 10_000;
const RESTART_DELAYS_MS = [250, 1000, 5000] as const;
const DEFAULT_DELAY_SECONDS = 3;

const binary = macosHelperBinary(path.resolve(import.meta.dirname, "../.."));
const client = new HelperClient({
  spawnHelper: () =>
    spawn(binary.path, [...binary.args], {
      stdio: ["pipe", "pipe", "inherit"],
    }),
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
  restartDelaysMs: RESTART_DELAYS_MS,
  onEvent: (event) => console.log(`  helper: ${event}`),
});

client.start();
const terminal = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "helper> ",
});
const context = { client, settings: { delaySeconds: DEFAULT_DELAY_SECONDS } };
let inputOpen = true;
terminal.on("close", () => {
  inputOpen = false;
});
console.log("Ahoy helper console. Type help for commands.");
terminal.prompt();

for await (const line of terminal) {
  if (!(await runCommand(line, context))) break;
  if (inputOpen) terminal.prompt();
}

client.stop();
terminal.close();
