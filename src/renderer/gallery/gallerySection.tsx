import type { ReactNode } from "react";
import { Text } from "../components/ui/text.tsx";

type GallerySectionProps = { title: string; children: ReactNode };

export function GallerySection({ title, children }: GallerySectionProps) {
  return (
    <section className="flex flex-col gap-6 border-rope border-t pt-8">
      <Text as="h2" variant="title">
        {title}
      </Text>
      {children}
    </section>
  );
}
