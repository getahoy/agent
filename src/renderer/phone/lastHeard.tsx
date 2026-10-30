import { motion } from "motion/react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { Text } from "../components/ui/text.tsx";
import { useNow } from "../hooks/useNow.ts";
import { useRise } from "../lib/motion.ts";
import { relativeTime } from "./relativeTime.ts";

const CLOCK_TICK_MS = 30_000;

type LastHeardProps = {
  heard: NonNullable<AgentState["lastHeard"]>;
  size: "popover" | "window";
};

export function LastHeard({ heard, size }: LastHeardProps) {
  const now = useNow(CLOCK_TICK_MS);
  const rise = useRise();
  const when = relativeTime(heard.at, now);
  return (
    <motion.div
      key={heard.at}
      role="status"
      className="flex flex-col gap-1"
      {...rise}
    >
      <Text as="span" variant="eyebrow" className="text-driftwood">
        {homeCopy.heardAt(agentCopy["heard.eyebrow"], when)}
      </Text>
      <Text variant={size === "window" ? "heard" : "heardSmall"}>
        {homeCopy.heard(heard.text)}
      </Text>
    </motion.div>
  );
}
