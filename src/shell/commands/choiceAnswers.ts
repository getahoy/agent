import {
  type CommandOutcome,
  done,
  failed,
  refused,
  spoken,
} from "../../core/commands/commandLog.ts";
import { buildSpeech, type SpeechCase } from "../../core/voice/buildSpeech.ts";
import type { ChoiceAnswer } from "../../core/voice/parseChoiceAnswer.ts";
import { mayDelegate } from "../../core/voice/threadRules.ts";
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

async function delegate({ open, choices, owner }: Answering) {
  const count = open.choice.options.length;
  if (!mayDelegate(open.choice.destructive)) {
    return said(refused, { kind: "delegateRefused", count });
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
      return Promise.resolve(said(refused, { kind: "confirm", button }));
    }
    case "outOfRange": {
      const count = open.choice.options.length;
      return Promise.resolve(said(failed, { kind: "outOfRange", count }));
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
