import { AnimatePresence, motion } from "motion/react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { useRise } from "../lib/motion.ts";
import type { Toast } from "./useToast.ts";

type HistoryToastProps = { toast: Toast | null; onUndo: () => void };

export function HistoryToast({ toast, onUndo }: HistoryToastProps) {
  const rise = useRise();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.text}
            role="status"
            className="pointer-events-auto flex h-9 items-center gap-2 rounded-pill bg-ink pr-1 pl-4 font-medium text-on-ink text-ui"
            {...rise}
            exit={{ opacity: 0 }}
          >
            {toast.text}
            {toast.undo ? (
              <button
                type="button"
                onClick={onUndo}
                className="h-7 cursor-default rounded-pill px-3 underline hover:bg-hover"
              >
                {historyCopy.undo}
              </button>
            ) : (
              <span className="w-3" />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
