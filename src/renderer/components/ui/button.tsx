import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { useSpinner } from "../../hooks/useSpinner.ts";
import { cn } from "../../lib/cn.ts";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium outline-none transition-[background-color,transform] duration-150 active:scale-97 disabled:pointer-events-none disabled:bg-linen disabled:text-fog motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        primary: "bg-ink text-on-ink",
        secondary: "border border-rope text-ink hover:bg-linen",
        ghost: "text-ink hover:bg-hover",
        destructive: "bg-flare text-on-flare",
        quietDestructive: "border border-rope text-flare hover:bg-linen",
      },
      size: {
        xs: "h-6.5 px-2.5 text-caption",
        sm: "h-7 px-3 text-caption",
        md: "h-8.5 px-4 text-ui",
        lg: "h-9.5 px-5.5 text-body-sm",
        xl: "h-10 px-5.5 text-body-sm",
      },
      width: { fit: "", full: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md", width: "fit" },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { pending?: boolean };

export function Button({
  className,
  variant,
  size,
  width,
  pending = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const spinning = useSpinner(pending);
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, width, className }))}
      disabled={disabled === true || pending}
      aria-busy={pending}
      {...props}
    >
      {spinning ? (
        <LoaderCircle
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-3.5 animate-spin"
        />
      ) : null}
      {children}
    </ButtonPrimitive>
  );
}
