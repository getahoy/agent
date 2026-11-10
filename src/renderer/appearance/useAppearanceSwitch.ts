import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  type Appearance,
  appearanceSchema,
  resolvedThemeSchema,
} from "../../core/appearance/appearance.ts";
import { schemeSettled } from "./schemeSettled.ts";

const CROSSFADE_DELAY_MS = 60;

export function useAppearanceSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const applied = appearanceSchema.catch("system").parse(theme);
  const [chosen, setChosen] = useState(applied);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const choose = (appearance: Appearance) => {
    setChosen(appearance);
    if (pending.current) clearTimeout(pending.current);
    const apply = async () => {
      const resolved = await window.ahoy.changeAppearance(appearance);
      await schemeSettled(resolved);
      flushSync(() => setTheme(appearance));
    };
    if (reducedMotion) {
      void apply();
      return;
    }
    pending.current = setTimeout(() => {
      document.startViewTransition(apply);
    }, CROSSFADE_DELAY_MS);
  };

  return {
    chosen,
    applied,
    resolved: resolvedThemeSchema.catch("light").parse(resolvedTheme),
    choose,
  };
}
