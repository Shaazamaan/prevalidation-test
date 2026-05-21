import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin session protection
  if (pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/session")) {
    const session = req.cookies.get("admin_session")?.value;
    if (!session || session.length < 8) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Track referral and agent codes via cookies
  const ref = req.nextUrl.searchParams.get("ref");
  const agref = req.nextUrl.searchParams.get("agref");

  if ((ref && /^DBK-[A-Z0-9]{6}$/.test(ref)) || (agref && /^AGT-[A-Z0-9]{6}$/.test(agref))) {
    const res = NextResponse.next();
    if (ref && /^DBK-[A-Z0-9]{6}$/.test(ref)) {
      res.cookies.set("dbk_ref", ref, { maxAge: 30 * 24 * 60 * 60, httpOnly: true, sameSite: "lax", path: "/" });
    }
    if (agref && /^AGT-[A-Z0-9]{6}$/.test(agref)) {
      res.cookies.set("dbk_agref", agref, { maxAge: 30 * 24 * 60 * 60, httpOnly: true, sameSite: "lax", path: "/" });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/session/:path*", "/((?!api|_next|.*\\..*).*)"],
};
