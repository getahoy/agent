import { createApiClient } from "@getahoy/lib";

export function bearerClient(apiUrl: string, token: () => string | null) {
  return createApiClient({
    baseUrl: apiUrl,
    headers: () => {
      const current = token();
      return current ? { authorization: `Bearer ${current}` } : {};
    },
  });
}
