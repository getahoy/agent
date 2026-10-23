import type { RawData, WebSocket } from "ws";
import type { FrameStream } from "../../ports/frameStream.ts";

const HEARTBEAT_INTERVAL_MS = 15_000;

export class WebSocketFrameStream implements FrameStream {
  readonly #socket: WebSocket;
  readonly #heartbeat: ReturnType<typeof setInterval>;
  #alive = true;

  constructor(socket: WebSocket) {
    this.#socket = socket;
    socket.on("pong", () => {
      this.#alive = true;
    });
    this.#heartbeat = setInterval(
      () => this.#checkAlive(),
      HEARTBEAT_INTERVAL_MS,
    );
    socket.on("close", () => clearInterval(this.#heartbeat));
  }

  send(frame: Uint8Array): void {
    this.#socket.send(frame, { binary: true });
  }

  close(): void {
    this.#socket.close();
  }

  onFrame(listener: (frame: Uint8Array) => void): void {
    this.#socket.on("message", (data: RawData, isBinary: boolean) => {
      if (isBinary && Buffer.isBuffer(data)) listener(new Uint8Array(data));
      else this.close();
    });
  }

  onClose(listener: () => void): void {
    this.#socket.on("close", listener);
  }

  #checkAlive(): void {
    if (!this.#alive) {
      this.#socket.terminate();
      return;
    }
    this.#alive = false;
    this.#socket.ping();
  }
}
