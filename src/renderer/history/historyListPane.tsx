import type { HistoryEntry, HistoryFilter } from "@getahoy/protocol";
import type { ReactNode, UIEvent } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { cn } from "../lib/cn.ts";
import { HistoryDays } from "./historyDays.tsx";
import { HistoryListTools } from "./historyListTools.tsx";
import { HistoryLoading } from "./historyLoading.tsx";
import { HistoryRefresh } from "./historyRefresh.tsx";

type FirstLoad = { busy: boolean; showLoader: boolean; fadeIn: boolean };

type HistoryListPaneProps = {
  firstLoad: FirstLoad;
  entries: readonly HistoryEntry[];
  selected: string | null;
  notice: string | null;
  summary: string | null;
  summaryPending: boolean;
  search: string;
  filter: HistoryFilter;
  blank: ReactNode;
  canClear: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
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
  const dim =
    props.selected !== null &&
    "opacity-40 focus-within:opacity-100 hover:opacity-100";
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
      className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto px-7 pt-12 pb-8"
    >
      <div className="flex max-w-entry-row items-center justify-between px-3 pb-2.5">
        <h1 className="font-display text-title">{historyCopy.title}</h1>
        <HistoryRefresh
          refreshing={props.refreshing}
          onRefresh={() => void props.refresh()}
        />
      </div>
      <div
        className={cn(
          "flex max-w-entry-row flex-col gap-2.5 px-3 pb-2 transition-opacity duration-240",
          dim,
        )}
      >
        <HistoryListTools {...props} />
      </div>
      {firstLoad.showLoader ? (
        <HistoryLoading busy={firstLoad.busy} />
      ) : (
        <div className={cn("flex flex-col", fade)}>
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
