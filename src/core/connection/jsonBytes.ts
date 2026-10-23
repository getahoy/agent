const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeJson(message: unknown): Uint8Array {
  return encoder.encode(JSON.stringify(message));
}

export function decodeJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    return undefined;
  }
}
