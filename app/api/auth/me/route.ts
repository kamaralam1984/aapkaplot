import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null, isAdmin: false });
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  const isAdmin =
    isAdminRole(session.role) ||
    (!!session.email && superAdminEmails.includes(session.email.toLowerCase()));
  return NextResponse.json({ session, isAdmin });
}
