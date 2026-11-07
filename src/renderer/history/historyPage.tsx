import { ClearHistoryDialog } from "./clearHistoryDialog.tsx";
import { EntryDialogs } from "./entryDialogs.tsx";
import { HistoryBlank } from "./historyBlank.tsx";
import { HistoryDrawer } from "./historyDrawer.tsx";
import { HistoryListPane } from "./historyListPane.tsx";
import { HistoryToast } from "./historyToast.tsx";
import { useEntryTools } from "./useEntryTools.ts";
import { useHistoryPage } from "./useHistoryPage.ts";

export function HistoryPage() {
  const page = useHistoryPage();
  const { view, query, toasts, blank } = page;
  const retry = () => void query.refetch();
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
    <div className="relative flex h-full min-h-0">
      <HistoryListPane
        {...page}
        selected={page.selected?.id ?? null}
        search={view.search}
        filter={view.filter}
        blank={shownBlank}
        onSearch={view.setSearch}
        onFilter={view.setFilter}
        onOpen={view.open}
        onClear={() => page.setConfirming(true)}
        onNearEnd={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
      />
      {page.selected && !page.firstLoad.showLoader ? (
        <HistoryDrawer
          entry={page.selected}
          handlers={handlers}
          onClose={view.close}
        />
      ) : null}
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
