import { NextRequest, NextResponse } from "next/server";
import { hashIP, getRateLimitCount, incrementRateLimit } from "@/lib/db";

const MAX_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const ipHash = await hashIP(ip + "_admin");

    const attempts = await getRateLimitCount(ipHash);
    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in an hour." },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const res = NextResponse.json({ success: true });
      res.cookies.set("admin_session", process.env.NEXTAUTH_SECRET!, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      return res;
    }

    await incrementRateLimit(ipHash);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (err) {
    console.error("[Admin Login] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
