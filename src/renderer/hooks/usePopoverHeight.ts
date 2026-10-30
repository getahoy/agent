import { type RefObject, useEffect } from "react";

export function usePopoverHeight(panel: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      void window.ahoy.setPopoverHeight(element.offsetHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [panel]);
}
