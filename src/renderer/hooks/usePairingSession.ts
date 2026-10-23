import { useEffect } from "react";

export function usePairingSession(): void {
  useEffect(() => {
    void window.ahoy.startPairing();
    return () => {
      void window.ahoy.stopPairing();
    };
  }, []);
}
