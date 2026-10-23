import type { Logger } from "@getahoy/lib";
import { WebSocketServer } from "ws";
import type { FrameStream } from "../../ports/frameStream.ts";
import { lanAddresses } from "./lanAddresses.ts";
import { WebSocketFrameStream } from "./webSocketFrameStream.ts";

const LOOPBACK_HOST = "127.0.0.1";
const ADDRESS_SYNC_MS = 5000;
const MAXIMUM_FRAME_BYTES = 64 * 1024;

type LanListenerOptions = {
  port: number;
  logger: Logger;
  onStream: (stream: FrameStream) => void;
};

export class LanListener {
  readonly #options: LanListenerOptions;
  readonly #servers = new Map<string, WebSocketServer>();
  #syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: LanListenerOptions) {
    this.#options = options;
  }

  start(): void {
    if (this.#syncTimer) return;
    this.#sync();
    this.#syncTimer = setInterval(() => this.#sync(), ADDRESS_SYNC_MS);
  }

  stop(): void {
    if (this.#syncTimer) clearInterval(this.#syncTimer);
    this.#syncTimer = null;
    for (const host of [...this.#servers.keys()]) this.#unbind(host);
  }

  #sync(): void {
    const wanted = new Set([LOOPBACK_HOST, ...lanAddresses()]);
    for (const host of this.#servers.keys()) {
      if (!wanted.has(host)) this.#unbind(host);
    }
    for (const host of wanted) {
      if (!this.#servers.has(host)) this.#bind(host);
    }
  }

  #bind(host: string): void {
    const { port, logger, onStream } = this.#options;
    const server = new WebSocketServer({
      host,
      port,
      maxPayload: MAXIMUM_FRAME_BYTES,
    });
    this.#servers.set(host, server);
    server.on("connection", (socket) =>
      onStream(new WebSocketFrameStream(socket)),
    );
    server.on("error", (error) => {
      logger.error("lan", "Listener failed, retrying on next sync", error);
      this.#unbind(host);
    });
  }

  #unbind(host: string): void {
    const server = this.#servers.get(host);
    if (!server) return;
    this.#servers.delete(host);
    for (const client of server.clients) client.terminate();
    server.close();
  }
}
