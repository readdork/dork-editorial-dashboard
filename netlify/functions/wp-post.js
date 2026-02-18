import { requireEnv, verifyHmac, json, text, wpFetchWithRetry } from "./_util.js";

export async function handler(event) {
  try {
    requireEnv(["GATEWAY_SECRET", "WP_BASE", "WP_USER", "WP_APP_PASSWORD"]);
    
    if (event.httpMethod !== "POST") {
      return text(405, "Method Not Allowed");
    }
    
    const rawBody = event.body || "";
    const v = verifyHmac(event, rawBody);
    if (!v.ok) {
      return json(401, { error: "Unauthorized", why: v.why });
    }
    
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json(400, { error: "Invalid JSON" });
    }
    
    const { id, data } = payload;
    if (!data || typeof data !== "object") {
      return json(400, { error: "Missing data" });
    }
    
    const path = id ? `/wp-json/wp/v2/posts/${id}` : "/wp-json/wp/v2/posts";
    const method = id ? "PUT" : "POST";
    
    const wpRes = await wpFetchWithRetry(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    let body;
    try {
      body = JSON.parse(wpRes.text);
    } catch {
      body = { raw: wpRes.text };
    }
    
    return json(wpRes.status, { ok: wpRes.status < 300, status: wpRes.status, body });
  } catch (e) {
    return json(500, { error: e.message });
  }
}
