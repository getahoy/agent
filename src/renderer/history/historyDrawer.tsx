import type { HistoryEntry } from "@getahoy/protocol";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import type { EntryHandlers } from "./detailActions.tsx";
import { HistoryDetail } from "./historyDetail.tsx";

type HistoryDrawerProps = {
  entry: HistoryEntry;
  handlers: EntryHandlers;
  onClose: () => void;
};

const OTHER_DIALOG = '[role="dialog"], [role="alertdialog"]';

export function HistoryDrawer({
  entry,
  handlers,
  onClose,
}: HistoryDrawerProps) {
  const drawer = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
  }, []);
  useEffect(() => {
    const pressed = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target instanceof Element ? event.target : null;
      const host = target?.closest(OTHER_DIALOG);
      if (host && host !== drawer.current) return;
      onClose();
    };
    window.addEventListener("keydown", pressed);
    return () => window.removeEventListener("keydown", pressed);
  }, [onClose]);
  return (
    <div
      ref={drawer}
      role="dialog"
      aria-label={historyCopy.entry}
      className="absolute inset-y-0 right-0 flex w-drawer animate-drawer-in flex-col overflow-y-auto bg-paper shadow-drawer motion-reduce:animate-qr-fade"
    >
      <div className="flex h-13 shrink-0 justify-end px-2 pt-2">
        <button
          ref={close}
          type="button"
          aria-label={historyCopy.closeEntry}
          title={historyCopy.closeEntryHint}
          onClick={onClose}
          className="app-no-drag flex size-10 cursor-default items-center justify-center rounded-pill text-driftwood hover:bg-linen"
        >
          <X aria-hidden="true" className="size-4.5" strokeWidth={1.5} />
        </button>
      </div>
      <HistoryDetail entry={entry} handlers={handlers} />
    </div>
  );
}
