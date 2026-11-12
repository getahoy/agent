import type { Appearance } from "@getahoy/lib";
import { appearanceCopy } from "../../copy/appearanceCopy.ts";
import { cn } from "../lib/cn.ts";
import { AppearanceTileFace } from "./appearanceTileFace.tsx";

type AppearanceTileProps = {
  appearance: Appearance;
  selected: boolean;
  onChoose: (appearance: Appearance) => void;
};

export function AppearanceTile({
  appearance,
  selected,
  onChoose,
}: AppearanceTileProps) {
  return (
    <label className="flex cursor-default flex-col items-center gap-2">
      <input
        type="radio"
        name="appearance"
        value={appearance}
        checked={selected}
        onChange={() => onChoose(appearance)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "relative h-appearance-tile w-appearance-tile overflow-hidden rounded-tile transition-shadow duration-150 ease-out",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-signal peer-focus-visible:outline-offset-4",
          selected ? "shadow-tile-ring" : "shadow-none",
        )}
      >
        <AppearanceTileFace scheme={appearance === "dark" ? "dark" : "light"} />
        {appearance === "system" ? (
          <span className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
            <AppearanceTileFace scheme="dark" />
          </span>
        ) : null}
        <span className="absolute inset-0 rounded-tile shadow-tile-edge" />
      </span>
      <span
        className={cn(
          "text-caption",
          selected ? "font-semibold" : "font-normal",
        )}
      >
        {appearanceCopy.options[appearance]}
      </span>
    </label>
  );
}
