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
    //   "filename": "image.jpg",
    //   "mime": "image/jpeg",
    //   "dataBase64": "<base64>",
    //   "title": "Optional",
    //   "altText": "Optional",
    //   "caption": "Optional (HTML allowed)",
    //   "description": "Optional (HTML allowed)",
    //   "status": "inherit" (optional; WP default is fine),
    //   "postId": 123 (optional: attach to post),
    //   "setAsFeatured": true/false (optional)
    // }
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
    // WP accepts raw body with Content-Disposition + Content-Type
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

    // Update media metadata if provided
    const meta = {};
    if (payload.title) meta.title = payload.title;
    if (payload.altText !== undefined) meta.alt_text = payload.altText;
    if (payload.caption) meta.caption = payload.caption;
    if (payload.description) meta.description = payload.description;

    if (mediaId && Object.keys(meta).length > 0) {
      await wpFetchWithRetry(`/wp-json/wp/v2/media/${mediaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
    }

    // Attach to post if requested
    if (mediaId && payload.postId) {
      await wpFetchWithRetry(`/wp-json/wp/v2/posts/${payload.postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured_media: mediaId }),
      });
    }

    return {
      statusCode: uploadRes.status,
      headers: { "Content-Type": "application/json" },
      body: uploadRes.text,
    };
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}
