import type { Area } from "../resolver/elementArea.ts";
import {
  capitalised,
  sayOneOf,
  sentence,
  spokenNumber,
  withinSpeechLimit,
} from "./spokenWords.ts";

export type SpeechCase =
  | { kind: "done"; message: string }
  | { kind: "say"; message: string }
  | {
      kind: "choices";
      label: string;
      nouns: string;
      areas: readonly (Area | null)[];
    }
  | { kind: "nearMiss"; label: string }
  | { kind: "notFound"; label: string }
  | { kind: "confirm"; button: string }
  | { kind: "draft"; name: string | null }
  | { kind: "outOfRange"; count: number }
  | { kind: "delegated"; label: string; area: Area | null }
  | { kind: "delegateRefused"; count: number }
  | { kind: "manyTabs" }
  | { kind: "cancelled" }
  | { kind: "startOver" }
  | { kind: "screenChanged" };

const MAX_LISTED_CHOICES = 3;

const AREA_PHRASES: Readonly<Record<Area, string>> = {
  toolbar: "in the toolbar",
  sidebar: "in the sidebar",
  bottom: "at the bottom",
};

// Areas help only when each option has its own; a repeat would confuse more than it helps.
function describedAreas(areas: readonly (Area | null)[]): Area[] | null {
  const known = areas.flatMap((area) => (area ? [area] : []));
  const distinct = new Set(known).size === areas.length;
  return known.length === areas.length && distinct ? known : null;
}

function choicesLine(
  label: string,
  nouns: string,
  areas: readonly (Area | null)[],
) {
  const count = areas.length;
  if (count > MAX_LISTED_CHOICES) {
    const many = `I see ${spokenNumber(count)} matches.`;
    return `${many} They're numbered on your Mac. Say a number.`;
  }
  const seen = `I see ${spokenNumber(count)} ${capitalised(label)} ${nouns}.`;
  const described = describedAreas(areas);
  const where = described
    ? ` ${described.map((area, index) => `${index === 0 ? "One" : spokenNumber(index + 1)} ${AREA_PHRASES[area]}`).join(", ")}.`
    : "";
  return `${seen}${where} ${sayOneOf(count)}.`;
}

function line(speech: SpeechCase): string {
  switch (speech.kind) {
    case "done":
      return `Done. ${sentence(speech.message)}`;
    case "say":
      return sentence(speech.message);
    case "choices":
      return choicesLine(speech.label, speech.nouns, speech.areas);
    case "nearMiss":
      return `I can't find ${capitalised(speech.label)}. Did you mean one of these?`;
    case "notFound":
      return `I can't find ${capitalised(speech.label)} on screen. Try saying it differently.`;
    case "confirm":
      return `This can't be undone. Tap ${speech.button} on your phone to confirm.`;
    case "draft":
      return speech.name
        ? `Drafted an email to ${speech.name}. Check it and press Send.`
        : "Drafted an email. Add who it goes to, then press Send.";
    case "outOfRange":
      return `There are only ${spokenNumber(speech.count)}. ${sayOneOf(speech.count)}.`;
    case "delegated": {
      const where = speech.area ? ` ${AREA_PHRASES[speech.area]}` : "";
      return `Picked one, the ${speech.label}${where}.`;
    }
    case "delegateRefused":
      return `I won't pick for a delete. ${sayOneOf(speech.count)}, or cancel.`;
    case "manyTabs":
      return "Several tabs match. Say more of the tab's name.";
    case "cancelled":
      return "Cancelled.";
    case "startOver":
      return "Let's start over.";
    case "screenChanged":
      return "That screen changed. Ask again.";
    default: {
      const unhandled: never = speech;
      throw new Error(`Unhandled speech ${JSON.stringify(unhandled)}`);
    }
  }
}

export function buildSpeech(speech: SpeechCase): string | undefined {
  const spoken = withinSpeechLimit(line(speech));
  return spoken === "." ? undefined : spoken;
}
