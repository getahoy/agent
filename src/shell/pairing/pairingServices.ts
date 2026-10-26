import type { Logger } from "@getahoy/lib";
import {
  type DeviceDescription,
  type Hello,
  PROTOCOL_VERSION,
} from "@getahoy/protocol";
import { app } from "electron";
import type { DeviceIdentity } from "../../ports/platform.ts";
import type { AgentController } from "../agentController.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import { lanEndpoint } from "../lan/lanAddresses.ts";
import { PhoneLink } from "../lan/phoneLink.ts";
import { createDeviceAuthClient, type DeviceAuthClient } from "./deviceFlow.ts";
import { LinkMonitor } from "./linkMonitor.ts";
import type { PairingParts } from "./pairingParts.ts";
import { PairingSession } from "./pairingSession.ts";
import { handlePhoneGoodbye, phoneEndedPairing } from "./phoneEnded.ts";
import { signOutMac } from "./signOutMac.ts";
import { unpairPhone } from "./unpairPhone.ts";

type ServiceInput = {
  apiUrl: string;
  port: number;
  logger: Logger;
  identity: IdentityStore;
  device: DeviceIdentity;
  controller: AgentController;
};

function localHello(device: DeviceIdentity): Hello {
  return {
    protocolVersion: PROTOCOL_VERSION,
    platform: device.platform,
    appVersion: app.getVersion(),
    capabilities: [...device.capabilities],
  };
}

function desktopDescription(
  identity: IdentityStore,
  device: DeviceIdentity,
): DeviceDescription {
  return {
    ...localHello(device),
    publicKey: identity.encodedPublicKey(),
    displayName: device.displayName,
    platformVersion: device.platformVersion,
  };
}

function createPairingSession(
  input: ServiceInput,
  authClient: DeviceAuthClient,
  phoneLink: PhoneLink,
): PairingSession {
  const { apiUrl, port, logger, identity, device, controller } = input;
  return new PairingSession({
    apiUrl,
    authClient,
    identity,
    device: () => desktopDescription(identity, device),
    lanEndpoint: () => lanEndpoint(port),
    lanListening: () => controller.state().lanEnabled,
    logger,
    onStatus: (status) =>
      controller.setPairing(status, identity.pairedPhones()),
    onReplaced: (phones) => {
      for (const phone of phones) phoneLink.end(phone.publicKey, "replaced");
    },
  });
}

export function createPairingServices(input: ServiceInput) {
  const { apiUrl, port, logger, identity, device, controller } = input;
  const authClient = createDeviceAuthClient(apiUrl);
  const phoneLink = new PhoneLink({
    port,
    identity,
    localHello: localHello(device),
    logger,
    isLocked: () => controller.state().screenLocked,
    onConnectedPhones: (keys) => controller.setConnectedPhones(keys),
    onGoodbye: (phone, reason) => handlePhoneGoodbye(parts, phone, reason),
  });
  const monitor = new LinkMonitor({
    apiUrl,
    identity,
    logger,
    onPeerEnded: (phone, reason) =>
      void phoneEndedPairing(parts, phone, reason),
  });
  const pairing = createPairingSession(input, authClient, phoneLink);
  const parts: PairingParts = {
    identity,
    phoneLink,
    controller,
    monitor,
    authClient,
    logger,
  };
  return {
    phoneLink,
    pairing,
    monitor,
    unpairPhone: (publicKey: string) => unpairPhone(parts, publicKey),
    signOut: () => signOutMac(parts),
  };
}

export type PairingServices = ReturnType<typeof createPairingServices>;
