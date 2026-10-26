import { homeCopy } from "../../copy/homeCopy.ts";
import type { EndedNotice } from "../../core/appState/appState.ts";
import { ActionButton } from "./actionButton.tsx";

type EndedNoticeBannerProps = { notice: EndedNotice; onDismiss: () => void };

export function EndedNoticeBanner({
  notice,
  onDismiss,
}: EndedNoticeBannerProps) {
  const message =
    notice.reason === "removed"
      ? homeCopy.removedBanner(notice.phoneName)
      : homeCopy.signedOutBanner(notice.phoneName);
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-control border border-border p-3"
    >
      <p className="text-sm">{message}</p>
      <ActionButton tone="plain" onPress={onDismiss}>
        {homeCopy.dismiss}
      </ActionButton>
    </div>
  );
}
