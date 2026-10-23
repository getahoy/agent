import { DESKTOP_CLIENT_ID } from "@getahoy/protocol";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { z } from "zod";

const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";
const MS_PER_SECOND = 1000;

const refusalCodeSchema = z.enum([
  "authorization_pending",
  "slow_down",
  "expired_token",
  "access_denied",
  "invalid_grant",
  "invalid_request",
]);

const refusalSchema = z.object({ error: refusalCodeSchema });

type RefusalCode = z.infer<typeof refusalCodeSchema>;

export type DeviceAuthClient = ReturnType<typeof createDeviceAuthClient>;

export type IssuedCode = {
  deviceCode: string;
  userCode: string;
  intervalMs: number;
  expiresAt: number;
};

type CodeRequest =
  | { kind: "issued"; code: IssuedCode }
  | { kind: "failed"; failure: "network" | "server" };

type TokenPoll =
  | { kind: "approved"; sessionToken: string }
  | { kind: "pending" | "slowDown" | "expired" | "network" | "failed" };

const refusalOutcomes: Record<RefusalCode, TokenPoll> = {
  authorization_pending: { kind: "pending" },
  slow_down: { kind: "slowDown" },
  expired_token: { kind: "expired" },
  access_denied: { kind: "expired" },
  invalid_grant: { kind: "failed" },
  invalid_request: { kind: "failed" },
};

export function createDeviceAuthClient(apiUrl: string) {
  return createAuthClient({
    baseURL: apiUrl,
    plugins: [deviceAuthorizationClient()],
  });
}

export async function requestDeviceCode(
  client: DeviceAuthClient,
): Promise<CodeRequest> {
  const response = await client.device
    .code({ client_id: DESKTOP_CLIENT_ID })
    .catch(() => null);
  if (!response) return { kind: "failed", failure: "network" };
  if (!response.data) return { kind: "failed", failure: "server" };
  const { device_code, user_code, interval, expires_in } = response.data;
  const nowSeconds = Math.floor(Date.now() / MS_PER_SECOND);
  return {
    kind: "issued",
    code: {
      deviceCode: device_code,
      userCode: user_code,
      intervalMs: interval * MS_PER_SECOND,
      expiresAt: nowSeconds + expires_in,
    },
  };
}

export async function pollDeviceToken(
  client: DeviceAuthClient,
  deviceCode: string,
): Promise<TokenPoll> {
  const response = await client.device
    .token({
      grant_type: DEVICE_GRANT,
      device_code: deviceCode,
      client_id: DESKTOP_CLIENT_ID,
    })
    .catch(() => null);
  if (!response) return { kind: "network" };
  if (response.data) {
    return { kind: "approved", sessionToken: response.data.access_token };
  }
  const refusal = refusalSchema.safeParse(response.error);
  if (!refusal.success) return { kind: "failed" };
  return refusalOutcomes[refusal.data.error];
}
