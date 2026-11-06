import { historyCopy } from "../../copy/historyCopy.ts";
import { ConfirmDialog } from "../components/ui/confirmDialog.tsx";

type ClearHistoryDialogProps = {
  open: boolean;
  pending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ClearHistoryDialog(props: ClearHistoryDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      title={historyCopy.clearTitle}
      body={historyCopy.clearBody}
      confirmLabel={historyCopy.clearConfirm}
      cancelLabel={historyCopy.cancel}
    />
  );
}
