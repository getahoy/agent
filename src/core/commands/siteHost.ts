export const SITE_HOST = "(?:[a-z0-9-]+\\.)+(?:com|in|org|net|io|dev|ai)";

const WHOLE_HOST = new RegExp(`^${SITE_HOST}$`);

export function isSiteHost(host: string): boolean {
  return WHOLE_HOST.test(host);
}
