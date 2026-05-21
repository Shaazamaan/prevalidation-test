import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllServiceProviders, createServiceProvider, type ServiceProvider } from "@/lib/db";

export async function GET() {
  const providers = await getAllServiceProviders();
  return NextResponse.json({ providers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as Partial<ServiceProvider>;
  if (!body.name?.trim() || !body.bio?.trim()) {
    return NextResponse.json({ error: "Name and bio required" }, { status: 400 });
  }

  const provider = await createServiceProvider({
    name: body.name.trim(),
    category: body.category ?? "other",
    speciality: body.speciality?.trim() ?? "",
    location: body.location?.trim() ?? "",
    bio: body.bio.trim(),
    website: body.website?.trim(),
    email: session.user.email,
  });

  return NextResponse.json({ provider });
}
