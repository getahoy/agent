const WINDOW_MS = 60_000;
const MAXIMUM_HANDSHAKES_PER_WINDOW = 20;

export class HandshakeRateLimit {
  readonly #recent = new Map<string, number[]>();

  allow(address: string): boolean {
    const now = Date.now();
    const recent = (this.#recent.get(address) ?? []).filter(
      (at) => now - at < WINDOW_MS,
    );
    if (recent.length >= MAXIMUM_HANDSHAKES_PER_WINDOW) {
      this.#recent.set(address, recent);
      return false;
    }
    this.#recent.set(address, [...recent, now]);
    return true;
  }
}
