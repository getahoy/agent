import { Lock } from "lucide-react";
import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { phoneLink } from "../phone/phoneLink.ts";
import { endedNoticeText } from "../phone/phoneLinkCopy.ts";
import { PopoverFooter } from "./popoverFooter.tsx";
import { PopoverHeader } from "./popoverHeader.tsx";
import { PopoverPairCard } from "./popoverPairCard.tsx";
import { PopoverPhoneCard } from "./popoverPhoneCard.tsx";
import { PopoverProblems } from "./popoverProblems.tsx";

type PopoverContentProps = { state: AgentState };

export function PopoverContent({ state }: PopoverContentProps) {
  const link = phoneLink(state);
  return (
    <>
      <PopoverHeader lanEnabled={state.lanEnabled} />
      {link.kind === "none" ? (
        <PopoverPairCard />
      ) : (
        <PopoverPhoneCard
          kind={link.kind}
          phone={link.phone}
          lastHeard={state.lastHeard}
        />
      )}
      {state.endedNotice ? (
        <NoticeRow>{endedNoticeText(state.endedNotice)}</NoticeRow>
      ) : null}
      {link.kind === "locked" ? (
        <NoticeRow
          icon={
            <Lock
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-3.5 shrink-0"
            />
          }
        >
          {agentCopy["menubar.locked"]}
        </NoticeRow>
      ) : null}
      <PopoverProblems state={state} />
      <PopoverFooter hasPhone={link.kind !== "none"} />
    </>
  );
}
