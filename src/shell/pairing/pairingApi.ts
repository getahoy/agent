import { request } from "@getahoy/lib";
import {
  type PairingCompleteRequest,
  type PairingUnlinkRequest,
  pairingCompleteSchema,
  pairingUnlinkSchema,
} from "@getahoy/protocol";

type SessionCall<Body> = { apiUrl: string; sessionToken: string; body: Body };

function sessionRequest(call: SessionCall<unknown>, path: string) {
  return {
    url: new URL(path, call.apiUrl).toString(),
    method: "POST" as const,
    body: call.body,
    headers: { authorization: `Bearer ${call.sessionToken}` },
  };
}

export function completePairing(call: SessionCall<PairingCompleteRequest>) {
  const options = sessionRequest(call, "/api/pairing/complete");
  return request({ ...options, schema: pairingCompleteSchema });
}

export function unlinkPairing(call: SessionCall<PairingUnlinkRequest>) {
  const options = sessionRequest(call, "/api/pairing/unlink");
  return request({ ...options, schema: pairingUnlinkSchema });
}
