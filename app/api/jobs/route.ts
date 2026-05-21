import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllJobListings, createJobListing, deleteJobListing, getUserJobListings, type JobListing } from "@/lib/db";

export async function GET() {
  const jobs = await getAllJobListings();
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<JobListing>;
  if (!body.title?.trim() || !body.company?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: "Title, company, and description required" }, { status: 400 });
  }
  if (!body.applyUrl?.trim() && !body.applyEmail?.trim()) {
    return NextResponse.json({ error: "Either apply URL or apply email required" }, { status: 400 });
  }

  const job = await createJobListing({
    title: body.title.trim(),
    company: body.company.trim(),
    posterEmail: session.user.email,
    type: body.type ?? "full_time",
    remote: body.remote ?? false,
    location: body.location?.trim(),
    description: body.description.trim(),
    skills: Array.isArray(body.skills) ? body.skills : (body.skills as unknown as string ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
    equity: body.equity?.trim(),
    salary: body.salary?.trim(),
    applyUrl: body.applyUrl?.trim(),
    applyEmail: body.applyEmail?.trim(),
  });

  return NextResponse.json({ job });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Verify ownership
  const myListings = await getUserJobListings(session.user.email);
  if (!myListings.find((j) => j.id === id)) {
    return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  }

  await deleteJobListing(id);
  return NextResponse.json({ success: true });
}
