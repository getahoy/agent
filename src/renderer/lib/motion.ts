import { motionDurationMs, motionEasing } from "@getahoy/lib";
import { type Transition, useReducedMotion } from "motion/react";

const MS_PER_SECOND = 1000;

const durations = {
  fast: motionDurationMs.fast / MS_PER_SECOND,
  base: motionDurationMs.base / MS_PER_SECOND,
  slow: motionDurationMs.slow / MS_PER_SECOND,
} as const;

const RISE_PX = 8;
const POP_FROM_SCALE = 0.3;

type Entrance = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  transition: Transition;
};

const reducedFade: Entrance = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: durations.fast },
};

const rise: Entrance = {
  initial: { opacity: 0, y: RISE_PX },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durations.base, ease: motionEasing.out },
};

const pop: Entrance = {
  initial: { opacity: 0, scale: POP_FROM_SCALE },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: durations.base, ease: motionEasing.spring },
};

const fade: Entrance = {
  ...reducedFade,
  transition: { duration: durations.base, ease: motionEasing.out },
};

const MESSAGE_SECONDS = durations.slow;
const MESSAGE_RISE_PX = 12;

const messageFade: Entrance = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: MESSAGE_SECONDS },
};

const messageRise: Entrance = {
  initial: { opacity: 0, y: MESSAGE_RISE_PX },
  animate: { opacity: 1, y: 0 },
  transition: { duration: MESSAGE_SECONDS, ease: motionEasing.out },
};

export function useMessageEnter(): Entrance {
  return useReducedMotion() ? messageFade : messageRise;
}

export function useRise(): Entrance {
  return useReducedMotion() ? reducedFade : rise;
}

export function usePop(): Entrance {
  return useReducedMotion() ? reducedFade : pop;
}

export function useFade(): Entrance {
  return useReducedMotion() ? reducedFade : fade;
}
