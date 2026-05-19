import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

export function isAdminServer(): boolean {
  const store = cookies();
  const val = store.get(SESSION_COOKIE)?.value;
  return !!val && val === process.env.NEXTAUTH_SECRET;
}

export function isAdminRequest(req: NextRequest): boolean {
  const val = req.cookies.get(SESSION_COOKIE)?.value;
  return !!val && val === process.env.NEXTAUTH_SECRET;
}
