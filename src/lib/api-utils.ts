import "server-only";
import { PayPalError } from "./paypal";
import { adminMode, hasAdminSession, isSameOrigin } from "./security";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Logs the full error server-side but never sends internal details to the browser. */
export function handleError(err: unknown) {
  if (err instanceof PayPalError) {
    console.error("[paypal]", err.status, err.message, JSON.stringify(err.details));
    if (err.status === 500 && err.message.includes("not configured")) {
      return jsonError("Payments are not configured on this server.", 503);
    }
    return jsonError("The payment provider could not process this request. Please try again.", 502);
  }
  console.error(err);
  return jsonError("Something went wrong on our side. Please try again.", 500);
}

/** Reads a JSON body with a size cap so oversized payloads are rejected early. */
export async function readJson<T>(request: Request, maxBytes = 32_000): Promise<T | Response> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return jsonError("Request is too large", 413);
  const text = await request.text();
  if (text.length > maxBytes) return jsonError("Request is too large", 413);
  try {
    return JSON.parse(text) as T;
  } catch {
    return jsonError("Invalid JSON");
  }
}

/**
 * Guards kitchen endpoints. Returns an error Response, or null when allowed.
 * Mutating requests must also come from our own origin (CSRF defence in depth;
 * the session cookie is already SameSite=Strict).
 */
export function requireAdmin(request: Request): Response | null {
  if (adminMode() === "locked") {
    return jsonError("Kitchen access is disabled: set ADMIN_PIN on the server.", 503);
  }
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return jsonError("Cross-site request blocked", 403);
  }
  if (!hasAdminSession(request)) return jsonError("Unauthorized", 401);
  return null;
}
