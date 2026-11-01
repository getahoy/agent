import { useEffect } from "react";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";

export function usePairingSession(status: PairingStatus["kind"]): void {
  useEffect(
    () => () => {
      void window.ahoy.stopPairing();
    },
    [],
  );

  useEffect(() => {
    if (status === "idle") void window.ahoy.startPairing();
  }, [status]);
}
