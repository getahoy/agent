import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { addFinished } from "./historyQueries.ts";

// Listens for the whole window, so a command finished while another page is open still shows.
export function useFinishedListener(): void {
  const client = useQueryClient();
  useEffect(
    () => window.ahoy.onHistoryFinished((entry) => addFinished(client, entry)),
    [client],
  );
}
