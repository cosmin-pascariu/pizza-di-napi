import { connection } from "next/server";
import { jsonError, readJson } from "@/lib/api-utils";
import {
  adminMode,
  checkPin,
  clearSessionCookie,
  createSessionCookie,
  hasAdminSession,
  isSameOrigin,
  loginLockedOut,
  rateLimit,
} from "@/lib/security";

/** Is the current visitor signed in to the kitchen? */
export async function GET(request: Request) {
  await connection();
  return Response.json(
    { mode: adminMode(), signedIn: hasAdminSession(request) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Sign in with the kitchen PIN. Limited to 5 attempts per minute per IP. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  const limited = rateLimit(request, "admin-login", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;
  if (adminMode() !== "pin") return jsonError("Kitchen PIN is not configured on this server.", 503);
  if (loginLockedOut()) {
    return jsonError("Too many wrong PINs. Sign-in is paused for a few minutes.", 429);
  }

  const body = await readJson<{ pin?: unknown }>(request, 1_000);
  if (body instanceof Response) return body;
  if (!checkPin(body.pin)) return jsonError("Wrong PIN", 401);

  return Response.json(
    { signedIn: true },
    { headers: { "Set-Cookie": createSessionCookie(), "Cache-Control": "no-store" } },
  );
}

/** Sign out. */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  return Response.json({ signedIn: false }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
