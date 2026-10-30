import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "../../lib/cn.ts";

export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-4.5 w-7.5 shrink-0 cursor-default items-center rounded-pill bg-rope outline-none transition-colors duration-150 data-checked:bg-signal data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none ml-0.5 block size-3.5 rounded-pill bg-switch-thumb shadow-thumb transition-transform duration-240 ease-spring data-checked:translate-x-3 motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  );
}
