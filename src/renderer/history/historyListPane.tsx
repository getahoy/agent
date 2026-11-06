import type { HistoryEntry, HistoryFilter } from "@getahoy/protocol";
import type { ReactNode, UIEvent } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { cn } from "../lib/cn.ts";
import { HistoryDays } from "./historyDays.tsx";
import { HistoryListTools } from "./historyListTools.tsx";
import { HistoryLoading } from "./historyLoading.tsx";

type FirstLoad = { busy: boolean; showLoader: boolean; fadeIn: boolean };

type HistoryListPaneProps = {
  firstLoad: FirstLoad;
  entries: readonly HistoryEntry[];
  selected: string | null;
  notice: string | null;
  summary: string | null;
  search: string;
  filter: HistoryFilter;
  blank: ReactNode;
  canClear: boolean;
  onSearch: (text: string) => void;
  onFilter: (filter: HistoryFilter) => void;
  onOpen: (id: string) => void;
  onClear: () => void;
  onNearEnd: () => void;
};

const NEAR_END_PX = 120;

export function HistoryListPane(props: HistoryListPaneProps) {
  const { firstLoad } = props;
  const fade = firstLoad.fadeIn && "animate-qr-fade";
  const scrolled = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const left = scrollHeight - scrollTop - clientHeight;
    if (left < NEAR_END_PX) props.onNearEnd();
  };
  const clear = props.canClear ? (
    <Button
      variant="ghost"
      className="mt-5 self-center text-driftwood"
      onClick={props.onClear}
    >
      {historyCopy.clearHistory}
    </Button>
  ) : null;
  return (
    <div
      onScroll={scrolled}
      className="flex h-full w-history-list shrink-0 flex-col overflow-y-auto border-rope border-r px-2 pt-12 pb-6"
    >
      <h1 className="px-2.5 pb-2.5 font-display text-title">
        {historyCopy.title}
      </h1>
      {firstLoad.showLoader ? (
        <HistoryLoading busy={firstLoad.busy} />
      ) : (
        <div className={cn("flex flex-col", fade)}>
          <div className="flex flex-col gap-2.5 px-2.5 pb-2">
            <HistoryListTools {...props} />
          </div>
          {props.blank}
          <HistoryDays
            entries={props.entries}
            selected={props.selected}
            onOpen={props.onOpen}
          />
          {clear}
        </div>
      )}
    </div>
  );
}
