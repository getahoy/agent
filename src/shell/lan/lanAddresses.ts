import { type NetworkInterfaceInfo, networkInterfaces } from "node:os";
import { type LanEndpoint, MAX_LAN_HOSTS } from "@getahoy/protocol";
import ipaddr from "ipaddr.js";

function isPrivateIpv4(entry: NetworkInterfaceInfo): boolean {
  if (entry.family !== "IPv4" || entry.internal) return false;
  return ipaddr.IPv4.parse(entry.address).range() === "private";
}

export function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter(isPrivateIpv4)
    .map((entry) => entry.address);
}

export function lanEndpoint(
  port: number,
  localHost: string | null,
): LanEndpoint | null {
  const hosts = lanAddresses().slice(0, MAX_LAN_HOSTS);
  if (hosts.length === 0) return null;
  return localHost ? { hosts, port, local: localHost } : { hosts, port };
}
