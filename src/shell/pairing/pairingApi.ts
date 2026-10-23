import { request } from "@getahoy/lib";
import {
  type PairingCompleteRequest,
  pairingCompleteSchema,
} from "@getahoy/protocol";

const COMPLETE_PATH = "/api/pairing/complete";

export function completePairing(
  apiUrl: string,
  sessionToken: string,
  body: PairingCompleteRequest,
) {
  return request({
    url: new URL(COMPLETE_PATH, apiUrl).toString(),
    method: "POST",
    body,
    headers: { authorization: `Bearer ${sessionToken}` },
    schema: pairingCompleteSchema,
  });
}
