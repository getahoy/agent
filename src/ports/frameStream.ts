export interface FrameStream {
  send(frame: Uint8Array): void;
  close(): void;
  onFrame(listener: (frame: Uint8Array) => void): void;
  onClose(listener: () => void): void;
}
