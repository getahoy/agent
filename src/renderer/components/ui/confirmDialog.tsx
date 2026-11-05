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
        <AlertDialog.Popup className="fixed inset-0 z-50 m-auto flex h-fit w-dialog flex-col items-center gap-2.5 rounded-dialog bg-material-dialog px-4.5 pt-5 pb-4 text-center shadow-dialog outline-none backdrop-blur-dialog transition-[opacity,translate] duration-240 ease-out data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0 motion-reduce:data-starting-style:translate-y-0">
          <PennantMark className="h-6.5 w-8.5 text-ink" />
          <AlertDialog.Title className="font-medium text-dialog-title">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-dialog-body text-driftwood">
            {body}
          </AlertDialog.Description>
          <div className="mt-1.5 flex w-full gap-2">
            <AlertDialog.Close
              render={
                <Button
                  variant="secondary"
                  size="md"
                  className="h-7.5 flex-1"
                />
              }
            >
              {cancelLabel}
            </AlertDialog.Close>
            <Button
              variant="destructive"
              size="md"
              className="h-7.5 flex-1"
              pending={pending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
