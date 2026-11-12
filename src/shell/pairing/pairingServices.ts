import type { ApiClient, Logger } from "@getahoy/lib";
import {
  COMMAND_LOOKUP_CAPABILITY,
  type DeviceDescription,
  type GoodbyeReason,
  type Hello,
  PROTOCOL_VERSION,
} from "@getahoy/protocol";
import { app, net } from "electron";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import type { DeviceIdentity } from "../../ports/platform.ts";
import type { AgentController } from "../agentController.ts";
import type { CommandReceiver } from "../commands/commandReceiver.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
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
  api: ApiClient;
  lan: { port: number; localHostName: () => Promise<string | null> };
  logger: Logger;
  identity: IdentityStore;
  device: DeviceIdentity;
  controller: AgentController;
  commands: CommandReceiver;
  onPhoneEnded: () => void;
  onPhoneRefused: () => void;
};

function localHello(device: DeviceIdentity): Hello {
  return {
    protocolVersion: PROTOCOL_VERSION,
    platform: device.platform,
    appVersion: app.getVersion(),
    capabilities: [...device.capabilities, COMMAND_LOOKUP_CAPABILITY],
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
  const { apiUrl, logger, identity, device, controller } = input;
  return new PairingSession({
    apiUrl,
    authClient,
    identity,
    device: () => desktopDescription(identity, device),
    lanEndpoint: () => phoneLink.lanEndpoint(),
    lanListening: () => controller.state().lanEnabled,
    isOnline: () => net.isOnline(),
    logger,
    onStatus: (status) => {
      controller.setPairing(status, identity.pairedPhones());
      if (status.kind === "paired") void controller.turnListeningOn();
    },
    onReplaced: (phones) => {
      for (const phone of phones) phoneLink.end(phone.publicKey, "replaced");
    },
  });
}

function createPhoneLink(
  input: ServiceInput,
  onGoodbye: (phone: PairedPhone, reason: GoodbyeReason) => void,
): PhoneLink {
  const { lan, logger, identity, device, controller, commands } = input;
  return new PhoneLink({
    lan,
    identity,
    localHello: localHello(device),
    logger,
    isLocked: () => controller.state().screenLocked,
    isListening: () => controller.state().lanEnabled,
    onRefused: input.onPhoneRefused,
    onConnectedPhones: (keys) => controller.setConnectedPhones(keys),
    onGoodbye: (phone, reason) => {
      if (!app.isPackaged) logger.info("lan", `Goodbye received (${reason})`);
      onGoodbye(phone, reason);
    },
    commands,
  });
}

export function createPairingServices(input: ServiceInput) {
  const { apiUrl, api, logger, identity, controller } = input;
  const authClient = createDeviceAuthClient(apiUrl);
  const phoneLink = createPhoneLink(input, (phone, reason) =>
    handlePhoneGoodbye(parts, phone, reason),
  );
  const monitor = new LinkMonitor({
    api,
    identity,
    logger,
    onPeerEnded: (phone, reason, whileAsleep) =>
      phoneEndedPairing(parts, phone, reason, whileAsleep),
  });
  const pairing = createPairingSession(input, authClient, phoneLink);
  const parts: PairingParts = {
    identity,
    phoneLink,
    controller,
    monitor,
    authClient,
    logger,
    onPhoneEnded: input.onPhoneEnded,
  };
  return {
    phoneLink,
    pairing,
    monitor,
    unpairPhone: (publicKey: string) => unpairPhone(parts, publicKey),
    simulatePhoneRemoved: () => {
      const [phone] = identity.pairedPhones();
      if (phone) phoneEndedPairing(parts, phone, "removed", false);
    },
    signOut: () => {
      pairing.stop();
      return signOutMac(parts);
    },
  };
}

export type PairingServices = ReturnType<typeof createPairingServices>;
