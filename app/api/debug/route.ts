import { NextResponse } from "next/server";

// Remove this route after debugging is done
export async function GET() {
  return NextResponse.json({
    hasGroq: !!process.env.GROQ_API_KEY,
    hasGemini: !!process.env.GOOGLE_AI_API_KEY,
    hasKvUrl: !!process.env.KV_REST_API_URL,
    hasKvToken: !!process.env.KV_REST_API_TOKEN,
    hasAdminUser: !!process.env.ADMIN_USERNAME,
    hasAdminPass: !!process.env.ADMIN_PASSWORD,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
  });
}
