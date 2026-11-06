import type { ReactNode } from "react";

export function DetailEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-medium font-mono text-driftwood text-label uppercase">
      {children}
    </span>
  );
}
