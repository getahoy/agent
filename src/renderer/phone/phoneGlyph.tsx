import { cva, type VariantProps } from "class-variance-authority";
import { Smartphone } from "lucide-react";

const glyphVariants = cva(
  "flex shrink-0 items-center justify-center rounded-pill",
  {
    variants: {
      size: {
        sm: "size-8 bg-material-tint [&_svg]:size-4",
        md: "size-10 bg-linen [&_svg]:size-5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

type PhoneGlyphProps = VariantProps<typeof glyphVariants>;

export function PhoneGlyph({ size }: PhoneGlyphProps) {
  return (
    <span aria-hidden="true" className={glyphVariants({ size })}>
      <Smartphone strokeWidth={1.5} />
    </span>
  );
}
