import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WindowContent, type WindowContentProps } from "./windowContent.tsx";

// In memory only: nothing the History page caches is ever written to disk.
// One retry, not three with backoff: a dead bridge or a signed-out Mac should say so fast.
const QUERY_DEFAULTS = { queries: { retry: 1 } };

export function WindowApp(props: WindowContentProps) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: QUERY_DEFAULTS }),
  );
  return (
    <QueryClientProvider client={client}>
      <WindowContent {...props} />
    </QueryClientProvider>
  );
}
