import { connection } from "next/server";
import { getMenu } from "@/lib/store";

export async function GET() {
  await connection();
  return Response.json({ menu: await getMenu() });
}
