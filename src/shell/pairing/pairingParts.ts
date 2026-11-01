import type { Logger } from "@getahoy/lib";
import type { AgentController } from "../agentController.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import type { PhoneLink } from "../lan/phoneLink.ts";
import type { DeviceAuthClient } from "./deviceFlow.ts";
import type { LinkMonitor } from "./linkMonitor.ts";
import type { PairingSession } from "./pairingSession.ts";

export type PairingParts = {
  identity: IdentityStore;
  phoneLink: PhoneLink;
  controller: AgentController;
  monitor: LinkMonitor;
  pairing: PairingSession;
  authClient: DeviceAuthClient;
  logger: Logger;
  onPhoneEnded: () => void;
};
