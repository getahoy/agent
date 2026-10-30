import { motion } from "motion/react";
import type { ReactNode } from "react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { cn } from "../lib/cn.ts";
import { useRise } from "../lib/motion.ts";

const SETUP_STEPS = ["welcome", "permissions", "pair"] as const;

type SetupFrameProps = {
  step: number | null;
  children: ReactNode;
};

export function SetupFrame({ step, children }: SetupFrameProps) {
  const rise = useRise();
  return (
    <main className="flex h-full flex-col items-center pt-14 pb-9">
      <div aria-hidden="true" className="app-drag fixed inset-x-0 top-0 h-10" />
      {step === null ? null : (
        <ol aria-label={agentCopy["setup.progress"]} className="flex gap-1.5">
          {SETUP_STEPS.map((name, index) => (
            <li
              key={name}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "size-1.5 rounded-pill bg-rope",
                index <= step && "bg-ink",
              )}
            />
          ))}
        </ol>
      )}
      <motion.div
        key={step}
        className="flex w-setup flex-1 flex-col items-center justify-center gap-5 text-center"
        {...rise}
      >
        {children}
      </motion.div>
    </main>
  );
}
