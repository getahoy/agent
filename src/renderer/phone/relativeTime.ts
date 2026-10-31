const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function relativeTime(at: number, now: number): string {
  const minutes = Math.round((at - now) / MS_PER_MINUTE);
  const size = Math.abs(minutes);
  if (size < MINUTES_PER_HOUR) return formatter.format(minutes, "minute");
  if (size < MINUTES_PER_DAY) {
    return formatter.format(Math.round(minutes / MINUTES_PER_HOUR), "hour");
  }
  return formatter.format(Math.round(minutes / MINUTES_PER_DAY), "day");
}
