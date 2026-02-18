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
    
    const { file, filename, mimeType, postId, featured } = payload;
    if (!file) {
      return json(400, { error: "Missing file (base64)" });
    }
    
    // Decode base64 and create form data
    const buffer = Buffer.from(file, "base64");
    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    
    const formData = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${filename || "upload"}"`,
      `Content-Type: ${mimeType || "application/octet-stream"}`,
      "",
      buffer.toString("binary"),
      `--${boundary}--`,
    ].join("\r\n");
    
    const wpRes = await wpFetchWithRetry("/wp-json/wp/v2/media", {
      method: "POST",
      headers: { 
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(Buffer.byteLength(formData, "binary"))
      },
      body: formData,
    });
    
    let body;
    try {
      body = JSON.parse(wpRes.text);
    } catch {
      body = { raw: wpRes.text };
    }
    
    // If postId provided and featured=true, set as featured image
    if (postId && featured && body.id) {
      await wpFetchWithRetry(`/wp-json/wp/v2/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured_media: body.id }),
      });
    }
    
    return json(wpRes.status, { ok: wpRes.status < 300, status: wpRes.status, body });
  } catch (e) {
    return json(500, { error: e.message });
  }
}
