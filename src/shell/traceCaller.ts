// The Error line, traceCaller() and the controller's #update come first in the stack.
const OWN_FRAMES = 3;

export function traceCaller(): string {
  const frames = new Error().stack?.split("\n") ?? [];
  const callers = frames.slice(OWN_FRAMES, OWN_FRAMES + 2);
  return callers.map((frame) => frame.trim()).join(" < ");
}
