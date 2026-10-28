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
};

export const PRESS_ACTION = "AXPress";

export function labelOf(element: ScreenElement): string | null {
  const { title, description, placeholder, help } = element;
  return title ?? description ?? placeholder ?? help ?? null;
}

export function sameFrame(first: Frame, second: Frame): boolean {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}
