import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export async function siteOrigin() {
  try {
    const incoming = await headers();
    const host = incoming.get("x-forwarded-host") || incoming.get("host");
    if (host) {
      const proto =
        incoming.get("x-forwarded-proto") ||
        (host.startsWith("localhost") || host.startsWith("127.") || host.startsWith("[::1]") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* render without a request */
  }
  return (env.APP_URL || "http://127.0.0.1:4317").replace(/\/$/, "");
}
