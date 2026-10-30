import { homeCopy } from "../../copy/homeCopy.ts";
import type { EndedNotice as Notice } from "../../core/appState/appState.ts";
import { Button } from "../components/ui/button.tsx";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { endedNoticeText } from "../phone/phoneLinkCopy.ts";

type EndedNoticeProps = { notice: Notice; onDismiss: () => void };

export function EndedNotice({ notice, onDismiss }: EndedNoticeProps) {
  return (
    <NoticeRow
      action={
        <Button variant="secondary" size="sm" onClick={onDismiss}>
          {homeCopy.dismiss}
        </Button>
      }
    >
      {endedNoticeText(notice)}
    </NoticeRow>
  );
}
