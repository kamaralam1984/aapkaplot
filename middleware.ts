import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, sessionCookie, isAdminRole } from "./lib/session";

/**
 * Gate /admin/* routes. We do a lightweight cookie-based session decode here
 * (Edge runtime), then trust the role embedded in the signed cookie. The API
 * routes under /api/admin/* perform a stricter DB-backed check via the
 * `requireAdmin` helper — middleware is the first line of defence, not the
 * only one.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get(sessionCookie.name)?.value;
  const session = decodeSession(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (!isAdminRole(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
