import { Toast } from "@base-ui/react/toast";
import type { ReactNode } from "react";
import { ToastViewport } from "./toastViewport.tsx";

const TOAST_MS = 3000;

const toastManager = Toast.createToastManager();
let shownId: string | null = null;

type ToastAction = { label: string; onAction: () => void };

export function toast(title: string, action?: ToastAction) {
  if (shownId) toastManager.close(shownId);
  const id = crypto.randomUUID();
  shownId = id;
  const actionProps = action && {
    children: action.label,
    onClick: () => {
      action.onAction();
      toastManager.close(id);
    },
  };
  toastManager.add({ id, title, ...(actionProps ? { actionProps } : {}) });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={TOAST_MS}>
      {children}
      <ToastViewport />
    </Toast.Provider>
  );
}
