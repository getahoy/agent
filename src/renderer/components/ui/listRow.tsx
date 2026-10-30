import type { ReactNode } from "react";

type ListRowProps = {
  title: string;
  detail?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ListRow({ title, detail, leading, trailing }: ListRowProps) {
  return (
    <li className="flex min-h-12 items-center gap-4 bg-paper px-4 py-3.5">
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <span className="font-medium text-body-sm">{title}</span>
        {detail ? (
          <span className="text-driftwood text-ui">{detail}</span>
        ) : null}
      </div>
      {trailing}
    </li>
  );
}
