import { requireEnv, verifyHmac, json, text, wpFetchWithRetry } from "./_util.js";

export async function handler(event) {
  try {
    requireEnv(["GATEWAY_SECRET", "WP_BASE", "WP_USER", "WP_APP_PASSWORD"]);
    if (event.httpMethod !== "POST") {
      return text(405, "Method Not Allowed");
    }

    const rawBody = event.body || "";
    const v = verifyHmac(event, rawBody);
    if (!v.ok) return text(401, v.why);

    // Incoming JSON schema:
    // {
    //   "action": "create" | "update",
    //   "post": { ...fields... },
    //   "id": 123 (required for update),
    //   "setFeaturedMediaId": 456 (optional)
    // }
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return text(400, "Invalid JSON");
    }

    const action = (payload.action || "create").toLowerCase();
    const post = payload.post || {};
    const setFeaturedMediaId = payload.setFeaturedMediaId;

    // Safety: default drafts unless explicitly set
    if (!post.status) post.status = "draft";

    let path;
    if (action === "create") {
      path = "/wp-json/wp/v2/posts";
    } else if (action === "update") {
      if (!payload.id) return text(400, "Missing id for update");
      path = `/wp-json/wp/v2/posts/${payload.id}`;
    } else {
      return text(400, "Unknown action");
    }

    const r = await wpFetchWithRetry(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });

    // If we want to set featured image, do a second call (only if post call succeeded)
    if (r.status >= 200 && r.status < 300 && setFeaturedMediaId) {
      let created;
      try {
        created = JSON.parse(r.text);
      } catch {
        created = null;
      }
      const postId = created?.id || payload.id;
      if (postId) {
        await wpFetchWithRetry(`/wp-json/wp/v2/posts/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featured_media: setFeaturedMediaId }),
        });
      }
    }

    return {
      statusCode: r.status,
      headers: { "Content-Type": "application/json" },
      body: r.text,
    };
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}
