import crypto from "crypto";

export function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function hmacHex(secret, msg) {
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function getHeader(event, name) {
  const key = name.toLowerCase();
  return event.headers?.[key] || event.headers?.[name] || "";
}

export function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

export function text(statusCode, body) {
  return { statusCode, body: String(body || "") };
}

export function requireEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);
}

export function verifyHmac(event, rawBody) {
  const secret = process.env.GATEWAY_SECRET;
  const ts = getHeader(event, "x-timestamp");
  const sig = getHeader(event, "x-signature");
  if (!secret) return { ok: false, why: "missing secret" };
  if (!ts || !sig) return { ok: false, why: "missing headers" };
  const now = Math.floor(Date.now() / 1000);
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(now - tsNum) > 90) {
    return { ok: false, why: "bad timestamp" };
  }
  const expected = hmacHex(secret, `${ts}.${rawBody}`);
  const ok = timingSafeEqualHex(expected, sig);
  return ok ? { ok: true } : { ok: false, why: "bad signature" };
}

export function wpBasicAuthHeader() {
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  const basic = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${basic}`;
}

export async function wpFetch(path, { method = "GET", headers = {}, body } = {}) {
  const base = process.env.WP_BASE;
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Authorization": wpBasicAuthHeader(),
      "User-Agent": "openclaw-netlify-gateway/1.0",
      ...headers,
    },
    body,
  });
  const text = await res.text();
  return { status: res.status, text, headers: Object.fromEntries(res.headers.entries()) };
}

export async function wpFetchWithRetry(path, opts) {
  const retryable = new Set([429, 500, 502, 503, 504]);
  let last;
  for (let i = 0; i < 4; i++) {
    const r = await wpFetch(path, opts);
    last = r;
    if (!retryable.has(r.status)) return r;
    const delay = (2 ** i) * 500 + Math.floor(Math.random() * 250);
    await sleep(delay);
  }
  return last;
}
