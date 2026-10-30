import type { ReactNode } from "react";

type ListGroupProps = { label?: string; children: ReactNode };

export function ListGroup({ label, children }: ListGroupProps) {
  return (
    <ul
      aria-label={label}
      className="flex w-full flex-col gap-px overflow-hidden rounded-group bg-rope text-left"
    >
      {children}
    </ul>
  );
}
