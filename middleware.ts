import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (!session || session.length < 8) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/session/:path*"],
};
