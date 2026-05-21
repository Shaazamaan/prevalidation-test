import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvestorCRM, saveInvestorCRM, completeOnboardingStep, type InvestorContact } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await getInvestorCRM(session.user.email);
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<InvestorContact>;
  if (!body.name?.trim() || !body.firm?.trim()) {
    return NextResponse.json({ error: "Name and firm required" }, { status: 400 });
  }

  const contacts = await getInvestorCRM(session.user.email);
  const newContact: InvestorContact = {
    id: uuidv4(),
    name: body.name.trim(),
    firm: body.firm.trim(),
    email: body.email?.trim(),
    linkedIn: body.linkedIn?.trim(),
    stage: body.stage ?? "angel",
    status: body.status ?? "to_contact",
    contactedOn: body.contactedOn,
    followUpOn: body.followUpOn,
    notes: body.notes?.trim() ?? "",
    addedAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveInvestorCRM(session.user.email, [newContact, ...contacts]);
  completeOnboardingStep(session.user.email!, "set_crm").catch(() => {});
  return NextResponse.json({ contact: newContact });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<InvestorContact> & { id: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const contacts = await getInvestorCRM(session.user.email);
  const idx = contacts.findIndex((c) => c.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  contacts[idx] = { ...contacts[idx], ...body, updatedAt: Date.now() };
  await saveInvestorCRM(session.user.email, contacts);
  return NextResponse.json({ contact: contacts[idx] });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const contacts = await getInvestorCRM(session.user.email);
  await saveInvestorCRM(session.user.email, contacts.filter((c) => c.id !== id));
  return NextResponse.json({ success: true });
}
