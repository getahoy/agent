export type RendererOrigin = {
  devServerUrl: string | null;
  indexFileUrl: string;
};

export function isOwnRendererUrl(
  candidate: string,
  origin: RendererOrigin,
): boolean {
  if (!URL.canParse(candidate)) return false;
  const url = new URL(candidate);
  if (origin.devServerUrl) {
    return url.origin === new URL(origin.devServerUrl).origin;
  }
  const index = new URL(origin.indexFileUrl);
  return url.protocol === "file:" && url.pathname === index.pathname;
}
