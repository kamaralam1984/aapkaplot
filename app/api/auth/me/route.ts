import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null });
  return NextResponse.json({ session });
}
