import type { SpeakTarget } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import { done, refused } from "../../core/commands/commandLog.ts";
import type { Turn } from "./commandTurns.ts";

export function pausedTurn(
  threadId: string,
  speakOn: SpeakTarget,
  closeBreaker: () => void,
): Turn {
  const pick = () => {
    closeBreaker();
    return Promise.resolve(done(commandCopy.resumed));
  };
  const options = [{ number: 1, label: commandCopy.resume }];
  const choice = {
    options,
    areas: [null],
    confirm: false,
    destructive: false,
    pick,
  };
  const paused = refused(commandCopy.breakerTripped);
  return { ...paused, choice, threadId, round: 0, speakOn };
}
