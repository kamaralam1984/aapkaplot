import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
export async function GET() {
  const session = await getSession();
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());
  const isAdmin = Boolean(session && (
    session.role === "admin" || session.role === "super_admin" ||
    (session.email && superAdminEmails.includes(session.email.toLowerCase()))
  ));
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ session, isAdmin, superAdminEmails });
}
