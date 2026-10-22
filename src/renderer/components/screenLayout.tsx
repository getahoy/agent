import type { ReactNode } from "react";
import { helperStatusCopy } from "../../copy/agentCopy.ts";
import type { HelperStatus } from "../../core/appState/appState.ts";

type ScreenLayoutProps = {
  title: string;
  helper: HelperStatus;
  children: ReactNode;
};

export function ScreenLayout({ title, helper, children }: ScreenLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <h1 className="font-semibold text-2xl">{title}</h1>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
      <p className="text-muted text-xs" aria-live="polite">
        {helperStatusCopy[helper]}
      </p>
    </main>
  );
}
