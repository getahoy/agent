import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WindowContent, type WindowContentProps } from "./windowContent.tsx";

// In memory only: nothing the History page caches is ever written to disk.
export function WindowApp(props: WindowContentProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <WindowContent {...props} />
    </QueryClientProvider>
  );
}
