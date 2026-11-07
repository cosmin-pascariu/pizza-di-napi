import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";

/* ------------------------------------------------------------------ */
/* Client IP                                                           */
/* ------------------------------------------------------------------ */

/**
 * Client IP for rate limiting. Behind Render/Vercel the platform proxy *appends* the
 * real client IP to x-forwarded-for, so we take the last entry: earlier entries are
 * whatever the client sent and could be forged to dodge the limits.
 */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return request.headers.get("x-real-ip") ?? "local";
}

/* ------------------------------------------------------------------ */
/* Rate limiting (in-memory, fixed window, per IP + bucket)            */
/* Good enough for a single instance; use Redis/Upstash when scaling.  */
/* ------------------------------------------------------------------ */

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  request: Request,
  bucket: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Response | null {
  const now = Date.now();
  const key = `${bucket}:${clientIp(request)}`;
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
  } else if (++entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Same-origin check for state-changing requests (CSRF defence)        */
/* ------------------------------------------------------------------ */

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Browsers always send Origin on cross-site POST/PATCH/DELETE; a missing header
    // means a non-browser client (curl, server-to-server), which CSRF can't come from.
    return true;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Kitchen (admin) session                                              */
/* ------------------------------------------------------------------ */

export const ADMIN_COOKIE = "pdn_admin";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

const isProd = () => process.env.NODE_ENV === "production";

/** Kitchen access is open only in local development when no PIN is configured. */
export function adminMode(): "pin" | "open-dev" | "locked" {
  if (process.env.ADMIN_PIN) return "pin";
  return isProd() ? "locked" : "open-dev";
}

function sessionSecret() {
  // A dedicated secret is best; otherwise derive one from the PIN so changing the PIN logs everyone out.
  const base = process.env.ADMIN_SESSION_SECRET ?? `pin:${process.env.ADMIN_PIN ?? ""}`;
  return createHash("sha256").update(base).digest();
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/* Global brake on wrong PINs, across all IPs, so a short PIN can't be brute-forced
   from many addresses. 30 failures in 15 minutes locks sign-in for the rest of the window. */
const failedLogins = { count: 0, resetAt: 0 };
const FAIL_LIMIT = 30;
const FAIL_WINDOW_MS = 15 * 60_000;

export function loginLockedOut(): boolean {
  return failedLogins.resetAt > Date.now() && failedLogins.count >= FAIL_LIMIT;
}

export function checkPin(pin: unknown): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected || typeof pin !== "string") return false;
  // Hash both sides so the comparison is constant-time regardless of length.
  const h = (s: string) => createHash("sha256").update(s).digest("hex");
  const ok = safeEqual(h(pin), h(expected));
  if (!ok) {
    const now = Date.now();
    if (failedLogins.resetAt <= now) Object.assign(failedLogins, { count: 0, resetAt: now + FAIL_WINDOW_MS });
    failedLogins.count++;
  }
  return ok;
}

export function createSessionCookie(): string {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const value = `${expires}.${sign(String(expires))}`;
  return [
    `${ADMIN_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    isProd() ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isProd() ? "; Secure" : ""}`;
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export function hasAdminSession(request: Request): boolean {
  const mode = adminMode();
  if (mode === "open-dev") return true;
  if (mode === "locked") return false;

  const raw = readCookie(request, ADMIN_COOKIE);
  if (!raw) return false;
  const [expires, sig] = raw.split(".");
  if (!expires || !sig || !safeEqual(sig, sign(expires))) return false;
  return Number(expires) > Date.now() / 1000;
}
