import type { ReactNode } from "react";

type GalleryWindowFrameProps = { children: ReactNode };

export function GalleryWindowFrame({ children }: GalleryWindowFrameProps) {
  return (
    <div className="h-window w-window overflow-hidden rounded-popover bg-sailcloth shadow-float">
      {children}
    </div>
  );
}
