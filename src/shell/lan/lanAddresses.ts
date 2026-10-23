import { type NetworkInterfaceInfo, networkInterfaces } from "node:os";
import ipaddr from "ipaddr.js";

export type LanEndpoint = { hosts: string[]; port: number };

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

export function lanEndpoint(port: number): LanEndpoint | null {
  const hosts = lanAddresses();
  return hosts.length > 0 ? { hosts, port } : null;
}
