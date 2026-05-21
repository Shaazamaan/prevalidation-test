import { auth } from "@/auth";
import { getAllServiceProviders } from "@/lib/db";
import ServiceDirectory from "@/components/ServiceDirectory";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Directory — Devbridge",
  description: "Find and list startup services — legal, finance, design, development, and more.",
};

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const [session, providers] = await Promise.all([
    auth(),
    getAllServiceProviders(),
  ]);

  return <ServiceDirectory providers={providers} userEmail={session?.user?.email ?? null} />;
}
