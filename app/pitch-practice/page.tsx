import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPitchPracticeCount, getToolPrice } from "@/lib/db";
import { getRazorpayKeys } from "@/lib/razorpay";
import PitchPractice from "@/components/PitchPractice";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Pitch Practice — Devbridge",
  description: "Face a sharp AI investor. Get grilled on your startup pitch with 10 tough questions and an instant score report.",
};

export default async function PitchPracticePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/pitch-practice");

  const [sessionCount, pricePaise, { keyId }] = await Promise.all([
    getPitchPracticeCount(session.user.email),
    getToolPrice("pitch_practice"),
    getRazorpayKeys(),
  ]);

  const priceDisplay = `₹${(pricePaise / 100).toLocaleString("en-IN")}`;

  return (
    <PitchPractice
      sessionCount={sessionCount}
      razorpayKey={keyId}
      priceDisplay={priceDisplay}
      pricePaise={pricePaise}
    />
  );
}
