import { motion } from "motion/react";
import { useState } from "react";
import type { AgentState } from "../../core/appState/appState.ts";
import { useFinishedListener } from "../history/useFinishedListener.ts";
import { cn } from "../lib/cn.ts";
import { useFade } from "../lib/motion.ts";
import { phoneLink } from "../phone/phoneLink.ts";
import { PageContent } from "./pageContent.tsx";
import { Sidebar } from "./sidebar.tsx";
import type { WindowPage } from "./windowPage.ts";

export type WindowContentProps = { state: AgentState; initialPage: WindowPage };

export function WindowContent({ state, initialPage }: WindowContentProps) {
  const [page, setPage] = useState<WindowPage>(initialPage);
  const fade = useFade();
  useFinishedListener();
  return (
    <div className="flex h-full">
      <div aria-hidden="true" className="app-drag fixed inset-x-0 top-0 h-10" />
      <Sidebar
        active={page}
        link={phoneLink(state)}
        lanEnabled={state.lanEnabled}
        onSelect={setPage}
      />
      <motion.main
        key={page}
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          page === "history"
            ? "overflow-hidden"
            : "gap-6 overflow-y-auto px-10 pt-12 pb-8",
        )}
        {...fade}
      >
        <PageContent page={page} state={state} onNavigate={setPage} />
      </motion.main>
    </div>
  );
}
