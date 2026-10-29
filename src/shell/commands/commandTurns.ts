import type { SpeakTarget } from "@getahoy/protocol";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import { parseChoiceAnswer } from "../../core/voice/parseChoiceAnswer.ts";
import { nextRound } from "../../core/voice/threadRules.ts";
import { answerChoice, startOver } from "./choiceAnswers.ts";
import type { ChoiceBook } from "./choiceBook.ts";

export type Turn = CommandOutcome & {
  threadId: string;
  round: number;
  speakOn: SpeakTarget;
};

type TurnContext = {
  commandId: string;
  owner: object;
  speakOn: SpeakTarget;
  choices: ChoiceBook;
};

// Decided when the command runs, not when it arrives: a command still queued may open the choice.
export async function commandTurn(
  text: string,
  run: (text: string) => Promise<CommandOutcome>,
  context: TurnContext,
): Promise<Turn> {
  const { commandId, owner, speakOn, choices } = context;
  const open = choices.openFor(owner);
  const answer = open && parseChoiceAnswer(text, open.choice.options.length);
  if (!open || !answer) {
    choices.expire();
    const outcome = await run(text);
    return { ...outcome, threadId: commandId, round: 0, speakOn };
  }
  const round = nextRound(open.round);
  const thread = { threadId: open.threadId, speakOn };
  if (round === null) return { ...startOver(choices), ...thread, round: 0 };
  choices.answered(round);
  const outcome = await answerChoice({ answer, open, choices, owner });
  return { ...outcome, ...thread, round };
}

export async function choiceTurn(
  parentId: string,
  number: number,
  context: TurnContext,
): Promise<Turn> {
  const { owner, speakOn, choices } = context;
  const open = choices.openFor(owner);
  const threadId = open?.parentId === parentId ? open.threadId : parentId;
  const round = (open && nextRound(open.round)) ?? 0;
  const outcome = await choices.pick(parentId, number, owner);
  return { ...outcome, threadId, round, speakOn };
}
