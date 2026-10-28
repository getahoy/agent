export type Frame = { x: number; y: number; width: number; height: number };

export type ScreenElement = {
  ref: string;
  role: string;
  subrole?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  help?: string | undefined;
  placeholder?: string | undefined;
  enabled: boolean;
  actions: readonly string[];
  frame?: Frame | undefined;
  clip?: Frame | undefined;
};

const PRESS_ACTION = "AXPress";

// Window buttons often have no title, only a subrole; people call them by these names.
const SUBROLE_NAMES: Readonly<Record<string, string>> = {
  AXCloseButton: "Close button",
  AXMinimizeButton: "Minimize button",
  AXZoomButton: "Zoom button",
  AXFullScreenButton: "Full screen button",
};

export function pressable(element: ScreenElement): boolean {
  return element.actions.includes(PRESS_ACTION);
}

export function subroleName(element: ScreenElement): string | undefined {
  return element.subrole ? SUBROLE_NAMES[element.subrole] : undefined;
}

export function textsOf(element: ScreenElement): string[] {
  const { title, description, placeholder, help } = element;
  return [title, description, placeholder, help].flatMap((text) =>
    text ? [text] : [],
  );
}

export function labelOf(element: ScreenElement): string | null {
  return textsOf(element)[0] ?? subroleName(element) ?? null;
}

export function sameFrame(first: Frame, second: Frame): boolean {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}
