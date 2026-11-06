import { randomUUID } from "node:crypto";
import type { Frame } from "@getahoy/protocol";
import type {
  HistoryReply,
  RanAgain,
} from "../../core/appState/historyBridge.ts";
import type { CommandReceiver } from "../commands/commandReceiver.ts";

// Runs on this Mac as if the phone had sent it, but silent: nobody is holding the phone.
export function createLocalRun(commands: CommandReceiver) {
  const owner = {};
  const run = (heard: string) =>
    new Promise<HistoryReply<RanAgain>>((resolve) => {
      const commandId = randomUUID();
      const request = {
        type: "command" as const,
        commandId,
        text: heard,
        speakOn: "off" as const,
      };
      const reply = (frame: Frame) => {
        if (frame.type !== "command.result") return;
        const { status, message } = frame;
        resolve({ kind: "ok", data: { status, message } });
      };
      commands.handle(request, reply, owner);
    });
  return { run, owner };
}

export type LocalRun = ReturnType<typeof createLocalRun>["run"];
