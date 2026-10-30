import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "./button.tsx";
import { PennantMark } from "./pennantMark.tsx";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  pending,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-scrim transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-dialog -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-popover bg-paper text-center shadow-dialog outline-none transition-[opacity,translate] duration-240 ease-out data-ending-style:opacity-0 data-starting-style:mt-2 data-starting-style:opacity-0 motion-reduce:duration-150 motion-reduce:data-starting-style:mt-0">
          <div className="flex flex-col items-center gap-2.5 bg-flare-mist px-4.5 pt-5 pb-3">
            <PennantMark className="h-6.5 w-8.5 text-flare" />
            <AlertDialog.Title className="font-medium text-body-sm">
              {title}
            </AlertDialog.Title>
          </div>
          <div className="flex flex-col gap-4 px-4.5 pt-3 pb-4">
            <AlertDialog.Description className="text-caption text-driftwood">
              {body}
            </AlertDialog.Description>
            <div className="flex gap-2">
              <AlertDialog.Close
                render={<Button variant="secondary" size="sm" width="full" />}
              >
                {cancelLabel}
              </AlertDialog.Close>
              <Button
                variant="destructive"
                size="sm"
                width="full"
                pending={pending}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
