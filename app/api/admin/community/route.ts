import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  getAllJobListings,
  getAllExpertSlotsAdmin,
  getAllDemoDayEntriesAdmin,
  getAllServiceProviders,
  getAllFounderCircles,
  getAllPitchCompetitionsAdmin,
  deleteJobListing,
  deleteExpertSlot,
  deleteDemoDayEntry,
  deleteServiceProvider,
  deleteFounderCircle,
  deletePitchCompetition,
  verifyServiceProvider,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = new Date().toISOString().slice(0, 7);
  const [jobs, expertSlots, demoDayEntries, providers, circles, events] = await Promise.all([
    getAllJobListings(),
    getAllExpertSlotsAdmin(),
    getAllDemoDayEntriesAdmin(month),
    getAllServiceProviders(),
    getAllFounderCircles(),
    getAllPitchCompetitionsAdmin(),
  ]);

  return NextResponse.json({ jobs, expertSlots, demoDayEntries, providers, circles, events, month });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await req.json() as { type: string; id: string };
  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  switch (type) {
    case "job":       await deleteJobListing(id); break;
    case "expert":    await deleteExpertSlot(id); break;
    case "demo":      await deleteDemoDayEntry(id); break;
    case "provider":  await deleteServiceProvider(id); break;
    case "circle":    await deleteFounderCircle(id); break;
    case "event":     await deletePitchCompetition(id); break;
    default: return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await req.json() as { type: string; id: string };
  if (type === "verify_provider") {
    await verifyServiceProvider(id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
