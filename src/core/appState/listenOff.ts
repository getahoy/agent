import { z } from "zod";

export const offDurationSchema = z.enum(["hour", "tomorrow", "untilOn"]);

export type OffDuration = z.infer<typeof offDurationSchema>;

const HOUR_MS = 60 * 60 * 1000;
const MORNING_HOUR = 8;

function nextMorning(now: Date): number {
  const morning = new Date(now);
  morning.setHours(MORNING_HOUR, 0, 0, 0);
  if (morning <= now) morning.setDate(morning.getDate() + 1);
  return morning.getTime();
}

export function offUntil(duration: OffDuration, now: Date): number | null {
  switch (duration) {
    case "hour":
      return now.getTime() + HOUR_MS;
    case "tomorrow":
      return nextMorning(now);
    case "untilOn":
      return null;
    default: {
      const unhandled: never = duration;
      return unhandled;
    }
  }
}
