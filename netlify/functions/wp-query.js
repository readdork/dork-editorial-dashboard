import { requireEnv, json, text, wpFetchWithRetry } from "./_util.js";

export async function handler(event) {
  try {
    // Hardcode env vars for testing
    process.env.WP_BASE = process.env.WP_BASE || 'https://readdork.com';
    process.env.WP_USER = process.env.WP_USER || 'stephen@welcometothebunker.com';
    process.env.WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || 'bjqI TK2J zGtW EV82 2Vn0 1HrG';
    process.env.GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'dork-wp-gateway-2026-secure-key-x7k9m2p4q8r5t1';
    
    requireEnv(["GATEWAY_SECRET", "WP_BASE", "WP_USER", "WP_APP_PASSWORD"]);
    
    if (event.httpMethod !== "POST") {
      return text(405, "Method Not Allowed");
    }

    const rawBody = event.body || "";
    const v = verifyHmac(event, rawBody);
    if (!v.ok) return text(401, v.why);

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return text(400, "Invalid JSON");
    }

    const { action, taxonomy, search, id } = payload;

    // List terms in a taxonomy
    if (action === "list_terms" || action === "get_terms") {
      const tax = taxonomy || "sections";
      const r = await wpFetchWithRetry(`/wp-json/wp/v2/${tax}?per_page=100`, {
        method: "GET",
      });
      return {
        statusCode: r.status,
        headers: { "Content-Type": "application/json" },
        body: r.text,
      };
    }

    // Search media library
    if (action === "search_media") {
      const query = search ? `?search=${encodeURIComponent(search)}&per_page=20` : "?per_page=20";
      const r = await wpFetchWithRetry(`/wp-json/wp/v2/media${query}`, {
        method: "GET",
      });
      return {
        statusCode: r.status,
        headers: { "Content-Type": "application/json" },
        body: r.text,
      };
    }

    // Get single media item
    if (action === "get_media" && id) {
      const r = await wpFetchWithRetry(`/wp-json/wp/v2/media/${id}`, {
        method: "GET",
      });
      return {
        statusCode: r.status,
        headers: { "Content-Type": "application/json" },
        body: r.text,
      };
    }

    return text(400, "Unknown action or missing parameters");
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}

import { verifyHmac } from "./_util.js";
