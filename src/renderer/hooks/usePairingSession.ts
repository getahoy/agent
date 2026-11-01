import { useEffect } from "react";

export function usePairingSession(needsFreshCode: boolean): void {
  useEffect(() => {
    void window.ahoy.startPairing();
    return () => {
      void window.ahoy.stopPairing();
    };
  }, []);

  useEffect(() => {
    if (needsFreshCode) void window.ahoy.startPairing();
  }, [needsFreshCode]);
}
