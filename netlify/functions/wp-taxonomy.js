import { requireEnv, verifyHmac, json, text, wpFetchWithRetry } from "./_util.js";

export async function handler(event) {
  try {
    requireEnv(["GATEWAY_SECRET", "WP_BASE", "WP_USER", "WP_APP_PASSWORD"]);
    if (event.httpMethod !== "POST" && event.httpMethod !== "GET") {
      return text(405, "Method Not Allowed");
    }

    const rawBody = event.body || "";
    const v = verifyHmac(event, rawBody);
    if (!v.ok) return text(401, v.why);

    const url = new URL(event.rawUrl || `https://localhost${event.path}`, "https://localhost");
    const taxonomy = url.searchParams.get("taxonomy") || "sections";
    
    const r = await wpFetchWithRetry(`/wp-json/wp/v2/${taxonomy}?per_page=100`, {
      method: "GET",
    });

    return {
      statusCode: r.status,
      headers: { "Content-Type": "application/json" },
      body: r.text,
    };
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}
