import type { ReactNode } from "react";

type GalleryPairProps = { label: string; children: ReactNode };

export function GalleryPair({ label, children }: GalleryPairProps) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="font-medium font-mono text-label text-driftwood uppercase">
        {label}
      </figcaption>
      <div className="flex flex-wrap gap-4">
        <div
          inert
          className="translate-z-0 scheme-light rounded-group bg-sailcloth p-4 text-ink"
        >
          {children}
        </div>
        <div
          inert
          className="translate-z-0 scheme-dark rounded-group bg-sailcloth p-4 text-ink"
        >
          {children}
        </div>
      </div>
    </figure>
  );
}
