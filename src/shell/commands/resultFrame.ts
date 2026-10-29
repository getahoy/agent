import { type Frame, MAX_RESULT_MESSAGE_CHARS } from "@getahoy/protocol";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import { buildSpeech, type SpeechCase } from "../../core/voice/buildSpeech.ts";
import type { Turn } from "./commandTurns.ts";

function defaultSpeech({ status, message }: CommandOutcome): SpeechCase {
  return status === "done"
    ? { kind: "done", message }
    : { kind: "say", message };
}

export function speechOf(outcome: CommandOutcome): string | undefined {
  return buildSpeech(outcome.speech ?? defaultSpeech(outcome));
}

export function resultFrame(commandId: string, turn: Turn): Frame {
  const { status, choice, threadId } = turn;
  const message = turn.message.slice(0, MAX_RESULT_MESSAGE_CHARS);
  const speech = speechOf(turn);
  return {
    type: "command.result",
    commandId,
    threadId,
    status,
    message,
    ...(speech ? { speech } : {}),
    choices: choice ? [...choice.options] : [],
    confirm: choice?.confirm ?? false,
  };
}
