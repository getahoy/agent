import { ClearHistoryDialog } from "./clearHistoryDialog.tsx";
import { HistoryBlank } from "./historyBlank.tsx";
import { HistoryDetail } from "./historyDetail.tsx";
import { HistoryListPane } from "./historyListPane.tsx";
import { HistoryToast } from "./historyToast.tsx";
import { useHistoryPage } from "./useHistoryPage.ts";

export function HistoryPage() {
  const page = useHistoryPage();
  const { view, list, toasts, blank } = page;
  const retry = () => void list.reload();
  const shownBlank =
    blank && blank !== "loading" ? (
      <HistoryBlank kind={blank} search={view.search} onRetry={retry} />
    ) : null;
  return (
    <div className="flex h-full min-h-0">
      <HistoryListPane
        entries={page.entries}
        selected={view.selected}
        notice={page.notice}
        summary={page.summary}
        search={view.search}
        filter={view.filter}
        blank={shownBlank}
        canClear={page.canClear}
        onSearch={view.setSearch}
        onFilter={view.setFilter}
        onOpen={view.setSelected}
        onClear={() => page.setConfirming(true)}
        onNearEnd={() => void list.loadMore()}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-paper">
        <HistoryDetail
          entry={page.selected}
          onCopy={page.copy}
          onDelete={page.deleteSelected}
        />
      </div>
      <HistoryToast toast={toasts.toast} onUndo={page.undo} />
      <ClearHistoryDialog
        open={page.confirming}
        pending={page.clearing}
        onConfirm={() => void page.clearAll()}
        onOpenChange={page.setConfirming}
      />
    </div>
  );
}
