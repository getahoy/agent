import type { ScrollAmount, WindowAction } from "@getahoy/protocol";
import type { Refusal } from "../core/commands/intent.ts";

type LevelName = "Volume" | "Brightness";

const scrollSizes: Readonly<Record<ScrollAmount, string>> = {
  small: " a little",
  page: "",
  large: " a lot",
};

const windowLines: Readonly<Record<WindowAction, (app: string) => string>> = {
  fullScreen: (app) => `${app} is full screen`,
  exitFullScreen: (app) => `${app} left full screen`,
  minimize: (app) => `Minimized ${app}`,
  fill: (app) => `${app} fills the screen`,
  leftHalf: (app) => `Moved ${app} to the left half`,
  rightHalf: (app) => `Moved ${app} to the right half`,
  nextDisplay: (app) => `Moved ${app} to the other screen`,
};

const refusals: Readonly<Record<Refusal, string>> = {
  oneAppVolume: "I can change the Mac’s volume, not one app’s yet.",
  keyboardLight:
    "I can change your Mac’s screen brightness, not the keyboard light yet.",
  externalDisplay:
    "I can change your Mac’s own screen. External displays aren’t supported yet.",
  autoScroll: "I can’t keep scrolling yet. Say scroll down, then more.",
};

export const systemCopy = {
  scrolled: (direction: string, amount: ScrollAmount, times: number) =>
    `Scrolled ${direction}${scrollSizes[amount]}${times > 1 ? ` ${times} times` : ""}`,
  atEdge: (edge: "top" | "bottom") => `At the ${edge}`,
  wentBack: "Went back",
  wentForward: "Went forward",
  reloaded: "Reloaded",
  playPause: "Pressed play/pause",
  nextTrack: "Next track",
  previousTrack: "Previous track",
  arranged: (action: WindowAction, app: string) => windowLines[action](app),
  notResizable: "That window can’t be resized.",
  oneScreen: "There’s only one screen.",
  noWindow: "No window is open in front.",
  locked: "Locked",
  moreOfWhat: "More of what?",
  muted: "Muted",
  unmuted: "Unmuted",
  levelMoved: (name: LevelName, from: number, to: number) =>
    `${name} ${from}% → ${to}%`,
  levelMax: (name: LevelName) => `${name} is at the maximum, 100%.`,
  levelMin: (name: LevelName) => `${name} is at the minimum, 0%.`,
  levelAlready: (name: LevelName, level: number) =>
    `${name} is already at ${level}%.`,
  brightnessStepped: (direction: "up" | "down") => `Brightness ${direction}`,
  brightnessAbout: (level: number) => `Brightness about ${level}%`,
  noVolumeControl: "This sound output has no volume control.",
  refused: (reason: Refusal) => refusals[reason],
};
