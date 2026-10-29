import {
  type CommandOutcome,
  done,
  failed,
  spoken,
} from "../../core/commands/commandLog.ts";
import { buildSpeech, type SpeechCase } from "../../core/voice/buildSpeech.ts";
import type { ChoiceAnswer } from "../../core/voice/parseChoiceAnswer.ts";
import type { ChoiceBook, OpenChoice } from "./choiceBook.ts";

type Answering = {
  answer: ChoiceAnswer;
  open: OpenChoice;
  choices: ChoiceBook;
  owner: object;
};

function said(
  build: (message: string) => CommandOutcome,
  speech: SpeechCase,
): CommandOutcome {
  return spoken(build(buildSpeech(speech) ?? ""), speech);
}

// The choice stays open, so it goes back with the reply and the phone keeps its sheet.
function askedAgain(
  speech: SpeechCase,
  open: OpenChoice,
): Promise<CommandOutcome> {
  const message = buildSpeech(speech) ?? "";
  const { choice } = open;
  return Promise.resolve({ status: "needsChoice", message, speech, choice });
}

async function delegate({ open, choices, owner }: Answering) {
  const count = open.choice.options.length;
  if (open.choice.destructive) {
    return askedAgain({ kind: "delegateRefused", count }, open);
  }
  const outcome = await choices.pick(open.parentId, 1, owner);
  const [first] = open.choice.options;
  if (outcome.status !== "done" || !first) return outcome;
  const area = open.choice.areas[0] ?? null;
  return spoken(outcome, { kind: "delegated", label: first.label, area });
}

// A spoken yes never confirms a destructive action: confirming is tap only.
export function answerChoice(answering: Answering): Promise<CommandOutcome> {
  const { answer, open, choices, owner } = answering;
  switch (answer.kind) {
    case "cancel":
      choices.expire();
      return Promise.resolve(said(done, { kind: "cancelled" }));
    case "pick": {
      if (!open.choice.confirm) {
        return choices.pick(open.parentId, answer.number, owner);
      }
      const button = open.choice.options[0]?.label ?? "";
      return askedAgain({ kind: "confirm", button }, open);
    }
    case "outOfRange": {
      const count = open.choice.options.length;
      return askedAgain({ kind: "outOfRange", count }, open);
    }
    case "delegate":
      return delegate(answering);
    default: {
      const unhandled: never = answer;
      throw new Error(`Unhandled answer ${JSON.stringify(unhandled)}`);
    }
  }
}

export function startOver(choices: ChoiceBook): CommandOutcome {
  choices.expire();
  return said(failed, { kind: "startOver" });
}
