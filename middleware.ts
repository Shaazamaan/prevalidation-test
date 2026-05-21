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

  // Track referral code in cookie when ?ref=CODE is present
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^DBK-[A-Z0-9]{6}$/.test(ref)) {
    const res = NextResponse.next();
    res.cookies.set("dbk_ref", ref, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/session/:path*", "/((?!api|_next|.*\\..*).*)"],
};
