import { Toast } from "@base-ui/react/toast";

export function ToastViewport() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="pointer-events-none fixed inset-x-0 bottom-5 flex h-9 justify-center">
        {toasts.map((shown) => (
          <Toast.Root
            key={shown.id}
            toast={shown}
            className="pointer-events-auto absolute bottom-0 flex h-9 items-center gap-2 rounded-pill bg-ink pr-1 pl-4 font-medium text-on-ink text-ui transition-[opacity,translate] duration-240 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:data-starting-style:translate-y-2 motion-reduce:duration-150"
          >
            <Toast.Title />
            {shown.actionProps ? (
              <Toast.Action className="h-7 cursor-default rounded-pill px-3 underline hover:bg-hover" />
            ) : (
              <span className="w-3" />
            )}
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
