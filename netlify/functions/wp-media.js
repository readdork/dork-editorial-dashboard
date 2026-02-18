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

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return text(400, "Invalid JSON");
    }

    const filename = payload.filename;
    const mime = payload.mime;
    const dataBase64 = payload.dataBase64;
    if (!filename || !mime || !dataBase64) {
      return text(400, "Missing filename/mime/dataBase64");
    }

    const bytes = Buffer.from(dataBase64, "base64");

    // Upload binary directly to WP media endpoint
    const uploadRes = await wpFetchWithRetry("/wp-json/wp/v2/media", {
      method: "POST",
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      body: bytes,
    });

    if (!(uploadRes.status >= 200 && uploadRes.status < 300)) {
      return {
        statusCode: uploadRes.status,
        headers: { "Content-Type": "application/json" },
        body: uploadRes.text,
      };
    }

    let media;
    try {
      media = JSON.parse(uploadRes.text);
    } catch {
      media = null;
    }

    const mediaId = media?.id;
    if (!mediaId) {
      return text(502, "Upload succeeded but no media id returned");
    }

    // Update metadata (title, caption, description, alt text)
    const metaPatch = {};
    if (payload.title) metaPatch.title = payload.title;
    if (payload.caption) metaPatch.caption = payload.caption;
    if (payload.description) metaPatch.description = payload.description;
    // WP stores alt text via a separate meta field in REST
    if (payload.altText) metaPatch.alt_text = payload.altText;
    // Attach to a post (optional)
    if (payload.postId) metaPatch.post = payload.postId;

    // Only patch if we have something to patch
    const needsPatch = Object.keys(metaPatch).length > 0;
    let finalMedia = media;
    if (needsPatch) {
      const patchRes = await wpFetchWithRetry(`/wp-json/wp/v2/media/${mediaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPatch),
      });
      if (patchRes.status >= 200 && patchRes.status < 300) {
        try {
          finalMedia = JSON.parse(patchRes.text);
        } catch {}
      }
    }

    // Set as featured image if requested + postId present
    if (payload.setAsFeatured && payload.postId) {
      await wpFetchWithRetry(`/wp-json/wp/v2/posts/${payload.postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured_media: mediaId }),
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, mediaId, media: finalMedia }),
    };
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}
