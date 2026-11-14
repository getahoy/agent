import type { ScrollAmount, WindowAction } from "@getahoy/protocol";
import type { Intent, MacAction, ParsedCommand, StepScale } from "./intent.ts";
import { parseLevelCommand, SIZE_WORDS } from "./parseLevelCommand.ts";

type Direction = "up" | "down";

const COUNTS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};
const SCROLL_SIZES: Readonly<Record<string, ScrollAmount>> = {
  "a little": "small",
  "a bit": "small",
  slowly: "small",
  slow: "small",
  "a lot": "large",
  fast: "large",
};
const HINDI_SCROLL: Readonly<Record<string, Direction>> = {
  "neeche karo": "down",
  "upar karo": "up",
};
const NAVIGATE: Readonly<Record<string, "back" | "forward">> = {
  back: "back",
  "go back": "back",
  forward: "forward",
  "go forward": "forward",
};
const AGAIN: Readonly<Record<string, StepScale>> = {
  more: "normal",
  again: "normal",
  aur: "normal",
  "keep going": "normal",
  "one more time": "normal",
  "once more": "normal",
  "do it again": "normal",
  "a bit more": "small",
  "a little more": "small",
  "thoda aur": "small",
  "a lot more": "large",
  "much more": "large",
};

const SCROLL = /^(?:scroll|page) (?:(way) )?(up|down)(?: (.+))?$/;
const COUNT = /^(\w+) (?:times|pages)$/;
const EDGE = /^(?:go|scroll|jump) to (?:the )?(top|bottom|end)$/;
const AUTO_SCROLL = /^(?:keep scrolling.*|scroll until .+|auto ?scroll.*)$/;
const RELOAD = /^(?:reload|refresh)(?: (?:the |this )?page| it| this)?$/;
const PLAY_PAUSE =
  /^(?:play|pause|resume|stop)(?: (?:the )?(?:music|song|video|it|this))?$/;
const NEXT = /^(?:next|skip)(?: (?:this )?(?:song|track|one|it|this))?$/;
const PREVIOUS = /^(?:previous(?: song| track)?|last (?:song|track))$/;
const LOCK =
  /^(?:lock(?: (?:my |the )?(?:mac|screen|computer|it))?|lock kar do|lock karo)$/;
const TOWARD = /^(?:(.+) )?(louder|quieter)$/;
const WINDOW = "(?:it|this|this window|the window)";
const MOVE = `(?:(?:move|put|snap|send) ${WINDOW} (?:to|on) (?:the )?)?`;
const WINDOW_RULES: readonly (readonly [RegExp, WindowAction])[] = [
  [/^(?:exit|leave) full ?screen$/, "exitFullScreen"],
  [new RegExp(`^(?:make ${WINDOW} |go |enter )?full ?screen$`), "fullScreen"],
  [new RegExp(`^minimi[sz]e(?: ${WINDOW})?$`), "minimize"],
  [new RegExp(`^(?:maximi[sz]e(?: ${WINDOW})?|fill the screen)$`), "fill"],
  [new RegExp(`^${MOVE}left half(?: of the screen)?$`), "leftHalf"],
  [new RegExp(`^${MOVE}right half(?: of the screen)?$`), "rightHalf"],
  [new RegExp(`^${MOVE}(?:other|next) (?:screen|display)$`), "nextDisplay"],
  [new RegExp(`^${MOVE}(?:other|next) monitor$`), "nextDisplay"],
];

function scrollSize(rest: string | undefined) {
  if (rest === undefined) return { amount: "page", times: 1 } as const;
  const amount = SCROLL_SIZES[rest];
  if (amount) return { amount, times: 1 };
  if (rest === "twice") return { amount: "page", times: 2 } as const;
  const count = COUNT.exec(rest)?.[1] ?? "";
  const times = COUNTS[count] ?? Number.parseInt(count, 10);
  return Number.isInteger(times) ? ({ amount: "page", times } as const) : null;
}

function scroll(command: string): MacAction | null {
  const page = { amount: "page", times: 1 } as const;
  const hindi = HINDI_SCROLL[command];
  if (hindi) return { kind: "scroll", direction: hindi, ...page };
  const edge = EDGE.exec(command)?.[1];
  if (edge) {
    const direction = edge === "top" ? "top" : "bottom";
    return { kind: "scroll", direction, ...page };
  }
  const [, way, direction, rest] = SCROLL.exec(command) ?? [];
  if (direction !== "up" && direction !== "down") return null;
  const large = { amount: "large", times: 1 } as const;
  const size = way ? large : scrollSize(rest);
  return size ? { kind: "scroll", direction, ...size } : null;
}

function media(command: string): MacAction | null {
  if (PLAY_PAUSE.test(command)) return { kind: "media", action: "playPause" };
  if (NEXT.test(command)) return { kind: "media", action: "next" };
  if (PREVIOUS.test(command)) return { kind: "media", action: "previous" };
  return null;
}

function navigate(command: string): MacAction | null {
  const to = RELOAD.test(command) ? "reload" : NAVIGATE[command];
  return to ? { kind: "navigate", to } : null;
}

function arrange(command: string): MacAction | null {
  const rule = WINDOW_RULES.find(([pattern]) => pattern.test(command));
  return rule ? { kind: "window", action: rule[1] } : null;
}

function again(command: string): Intent | null {
  const amount = AGAIN[command];
  if (amount) return { kind: "again", amount, toward: null };
  const [, size, word] = TOWARD.exec(command) ?? [];
  if (!word) return null;
  const scale = size === undefined ? "normal" : SIZE_WORDS[size];
  if (!scale) return null;
  const toward = word === "louder" ? "up" : "down";
  return { kind: "again", amount: scale, toward };
}

export function parseSystemCommand(
  command: string,
  installedApps: readonly string[],
): ParsedCommand | null {
  if (AUTO_SCROLL.test(command)) {
    return { kind: "refuse", reason: "autoScroll" };
  }
  if (LOCK.test(command)) return { kind: "intent", intent: { kind: "lock" } };
  const intent =
    scroll(command) ??
    navigate(command) ??
    media(command) ??
    arrange(command) ??
    again(command);
  if (intent) return { kind: "intent", intent };
  return parseLevelCommand(command, installedApps);
}
