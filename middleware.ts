import { NextResponse, type NextRequest } from "next/server";

/**
 * Quick existence check at the edge — if no session cookie is present, send
 * the user to /auth/login. Strict signature verification + role check runs
 * in app/admin/layout.tsx (server component, full Node runtime), because
 * `lib/session.ts` depends on `node:crypto` which the Edge runtime cannot
 * bundle.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get("akp_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
