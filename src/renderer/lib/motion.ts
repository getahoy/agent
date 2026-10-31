import { type Transition, useReducedMotion } from "motion/react";

const durations = { fast: 0.15, base: 0.24 } as const;

const easings = {
  out: [0.22, 1, 0.36, 1],
  spring: [0.34, 1.56, 0.64, 1],
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
  transition: { duration: durations.base, ease: easings.out },
};

const pop: Entrance = {
  initial: { opacity: 0, scale: POP_FROM_SCALE },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: durations.base, ease: easings.spring },
};

const fade: Entrance = {
  ...reducedFade,
  transition: { duration: durations.base, ease: easings.out },
};

export function useRise(): Entrance {
  return useReducedMotion() ? reducedFade : rise;
}

export function usePop(): Entrance {
  return useReducedMotion() ? reducedFade : pop;
}

export function useFade(): Entrance {
  return useReducedMotion() ? reducedFade : fade;
}
