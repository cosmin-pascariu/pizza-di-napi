import { connection } from "next/server";

/** Used by Render's health check. */
export async function GET() {
  await connection();
  return Response.json({ ok: true });
}
