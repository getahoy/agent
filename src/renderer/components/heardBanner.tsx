import { homeCopy } from "../../copy/homeCopy.ts";

type HeardBannerProps = { text: string };

export function HeardBanner({ text }: HeardBannerProps) {
  return (
    <p
      role="status"
      className="rounded-control border border-border p-3 text-muted text-sm"
    >
      {homeCopy.heard(text)}
    </p>
  );
}
