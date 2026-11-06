import { ClearHistoryDialog } from "./clearHistoryDialog.tsx";
import { EntryDialogs } from "./entryDialogs.tsx";
import { HistoryBlank } from "./historyBlank.tsx";
import { HistoryDetail } from "./historyDetail.tsx";
import { HistoryListPane } from "./historyListPane.tsx";
import { HistoryToast } from "./historyToast.tsx";
import { useEntryTools } from "./useEntryTools.ts";
import { useHistoryPage } from "./useHistoryPage.ts";

export function HistoryPage() {
  const page = useHistoryPage();
  const { view, list, toasts, blank } = page;
  const retry = () => void list.reload();
  const tools = useEntryTools({ show: toasts.show, reload: retry });
  const handlers = {
    running: tools.running,
    onRunAgain: tools.runAgain,
    onCopy: page.copy,
    onReport: () => tools.setDialog("report"),
    onDelete: page.deleteSelected,
  };
  const shownBlank =
    blank && blank !== "loading" ? (
      <HistoryBlank kind={blank} search={view.search} onRetry={retry} />
    ) : null;
  return (
    <div className="flex h-full min-h-0">
      <HistoryListPane
        {...page}
        selected={view.selected}
        search={view.search}
        filter={view.filter}
        blank={shownBlank}
        onSearch={view.setSearch}
        onFilter={view.setFilter}
        onOpen={view.setSelected}
        onClear={() => page.setConfirming(true)}
        onNearEnd={() => void list.loadMore()}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-paper">
        <HistoryDetail entry={page.selected} handlers={handlers} />
      </div>
      <HistoryToast toast={toasts.toast} onUndo={page.undo} />
      <EntryDialogs entry={page.selected} tools={tools} />
      <ClearHistoryDialog
        open={page.confirming}
        pending={page.clearing}
        onConfirm={() => void page.clearAll()}
        onOpenChange={page.setConfirming}
      />
    </div>
  );
}
