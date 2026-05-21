import type { Metadata } from "next";
import RunwayCalculator from "@/components/RunwayCalculator";

export const metadata: Metadata = {
  title: "Runway Calculator — Devbridge",
  description: "Calculate your startup's runway, break-even point, and monthly burn scenarios instantly.",
};

export default function RunwayPage() {
  return <RunwayCalculator />;
}
