import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createOrGetUser,
  assignReferral,
  getUserCoupons,
  getUserReferralStats,
  getUserSessionsByEmail,
  getOnboardingProgress,
  getDNAResult,
  getUserAchievements,
  getSessionCount,
} from "@/lib/db";
import UserDashboard from "@/components/UserDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const { email, name, image } = session.user;

  // Ensure user profile exists
  const user = await createOrGetUser(email!, name ?? "", image ?? undefined);

  // Process referral cookie if present and not already assigned
  const cookieStore = cookies();
  const refCode = cookieStore.get("dbk_ref")?.value;
  if (refCode && !user.referredBy && !user.joinedCouponIssued) {
    await assignReferral(email!, refCode).catch(() => {});
  }

  const [coupons, referralStats, reports, onboardingSteps, dnaResult, achievements, sessionCount] = await Promise.all([
    getUserCoupons(email!),
    getUserReferralStats(email!),
    getUserSessionsByEmail(email!),
    getOnboardingProgress(email!).catch(() => [] as string[]),
    getDNAResult(email!).catch(() => null),
    getUserAchievements(email!).catch(() => []),
    getSessionCount().catch(() => 0),
  ]);

  return (
    <UserDashboard
      user={user}
      coupons={coupons}
      referralStats={referralStats}
      reports={reports}
      siteUrl={(process.env.NEXTAUTH_URL ?? "https://devbridgekerala.com").replace(/\/$/, "")}
      onboardingSteps={onboardingSteps}
      dnaResult={dnaResult}
      achievements={achievements}
      sessionCount={sessionCount}
    />
  );
}
