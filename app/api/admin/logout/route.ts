import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
  return res;
}
