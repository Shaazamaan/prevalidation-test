import { auth } from "@/auth";
import type { NextRequest } from "next/server";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "shaazamaanshaji@gmail.com").toLowerCase();

export async function isAdminServer(): Promise<boolean> {
  const session = await auth();
  return session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
}

// req param kept for call-site compatibility; NextAuth v5 auth() reads cookies automatically
export async function isAdminRequest(_req: NextRequest): Promise<boolean> {
  const session = await auth();
  return session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
}
