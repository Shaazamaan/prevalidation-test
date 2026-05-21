import { kv } from "@vercel/kv";
import crypto from "crypto";

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type PaymentRecord = {
  orderId: string;
  paymentId: string;
  amount: number; // paise (0 for free/admin)
  coupon?: string;
  isFree: boolean;
  isAdmin: boolean;
  mode: "test" | "live";
  paidAt: number; // unix ms
};

export type Session = {
  id: string;
  founderName: string;
  email?: string;
  phone?: string;
  country?: string;
  startupIdea: string;
  startupType?: string;
  messages: Message[];
  status: "active" | "completed";
  createdAt: number;
  ipHash: string;
  adminNotes?: string;
  lastActivePhase?: number;
  payment?: PaymentRecord;
};

export type PhaseScore = {
  phase: number;
  title: string;
  score: number;
  note: string;
};

export type Report = {
  verdict: "READY" | "CONDITIONALLY READY" | "NOT READY";
  verdictExplanation: string;
  realityScore: number;
  phaseScores: PhaseScore[];
  contradictions: string[];
  founderStressTest: {
    solid: string[];
    gaps: string[];
    notHonestWith: string[];
  };
  projectStressTest: {
    coherent: string[];
    structuralWeaknesses: string[];
    unexaminedAssumptions: string[];
  };
  whatFounderDoesNotKnow: string[];
  mostDangerousAssumptions: string[];
  mustResolveBeforeValidation: string[];
  nextSteps: string[];
  killSignals: string[];
  finalSummary: string;
};

export type AdvisorSession = {
  id: string;
  tool: "advisor";
  founderName: string;
  email?: string;
  phone?: string;
  country?: string;
  intake: Record<string, unknown>;
  report: Record<string, unknown>;
  pathway: string;
  pathwayLabel: string;
  overallScore: number;
  createdAt: number;
  ipHash: string;
  adminNotes?: string;
  payment?: PaymentRecord;
};

export type PitchDeckSession = {
  id: string;
  tool: "pitch-deck";
  founderName?: string;
  email?: string;
  phone?: string;
  country?: string;
  context?: string;
  report: Record<string, unknown>;
  dbScore: number;
  grScore: number;
  overallVerdict: string;
  createdAt: number;
  ipHash: string;
  adminNotes?: string;
  payment?: PaymentRecord;
};

const SESSION_TTL = 90 * 24 * 60 * 60; // 90 days in seconds

export async function createSession(session: Session): Promise<void> {
  await kv.set(`session:${session.id}`, session, { ex: SESSION_TTL });
  const idx = (await kv.get<string[]>("sess:idx")) ?? [];
  if (!idx.includes(session.id)) {
    await kv.set("sess:idx", [session.id, ...idx].slice(0, 2000));
  }
}

export async function getSession(id: string): Promise<Session | null> {
  return kv.get<Session>(`session:${id}`);
}

export async function updateSession(id: string, data: Partial<Session>): Promise<void> {
  const session = await getSession(id);
  if (!session) throw new Error("Session not found");
  await kv.set(`session:${id}`, { ...session, ...data }, { ex: SESSION_TTL });
}

export async function saveReport(sessionId: string, report: Report): Promise<void> {
  await kv.set(`report:${sessionId}`, report, { ex: SESSION_TTL });
}

export async function getReport(sessionId: string): Promise<Report | null> {
  return kv.get<Report>(`report:${sessionId}`);
}

export async function getAllSessions(): Promise<Session[]> {
  const idx = (await kv.get<string[]>("sess:idx")) ?? [];
  if (!idx.length) return [];
  const sessions = await Promise.all(idx.map((id) => kv.get<Session>(`session:${id}`)));
  return (sessions.filter(Boolean) as Session[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSessionCount(): Promise<number> {
  const idx = (await kv.get<string[]>("sess:idx")) ?? [];
  return idx.length;
}

export async function deleteSession(id: string): Promise<void> {
  await kv.del(`session:${id}`);
  await kv.del(`report:${id}`);
  const idx = (await kv.get<string[]>("sess:idx")) ?? [];
  await kv.set("sess:idx", idx.filter((i) => i !== id));
}

// ── Advisor sessions ──────────────────────────────────────────────────────────

export async function saveAdvisorSession(session: AdvisorSession): Promise<void> {
  await kv.set(`advisor:${session.id}`, session, { ex: SESSION_TTL });
  const idx = (await kv.get<string[]>("adv:idx")) ?? [];
  if (!idx.includes(session.id)) {
    await kv.set("adv:idx", [session.id, ...idx].slice(0, 2000));
  }
}

export async function getAdvisorSession(id: string): Promise<AdvisorSession | null> {
  return kv.get<AdvisorSession>(`advisor:${id}`);
}

export async function getAllAdvisorSessions(): Promise<AdvisorSession[]> {
  const idx = (await kv.get<string[]>("adv:idx")) ?? [];
  if (!idx.length) return [];
  const sessions = await Promise.all(idx.map((id) => kv.get<AdvisorSession>(`advisor:${id}`)));
  return (sessions.filter(Boolean) as AdvisorSession[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteAdvisorSession(id: string): Promise<void> {
  await kv.del(`advisor:${id}`);
  const idx = (await kv.get<string[]>("adv:idx")) ?? [];
  await kv.set("adv:idx", idx.filter((i) => i !== id));
}

export async function updateAdvisorNotes(id: string, adminNotes: string): Promise<void> {
  const session = await getAdvisorSession(id);
  if (!session) throw new Error("Advisor session not found");
  await kv.set(`advisor:${id}`, { ...session, adminNotes }, { ex: SESSION_TTL });
}

// ── Pitch-deck sessions ───────────────────────────────────────────────────────

export async function savePitchDeckSession(session: PitchDeckSession): Promise<void> {
  await kv.set(`pitchdeck:${session.id}`, session, { ex: SESSION_TTL });
  const idx = (await kv.get<string[]>("pd:idx")) ?? [];
  if (!idx.includes(session.id)) {
    await kv.set("pd:idx", [session.id, ...idx].slice(0, 2000));
  }
}

export async function getPitchDeckSession(id: string): Promise<PitchDeckSession | null> {
  return kv.get<PitchDeckSession>(`pitchdeck:${id}`);
}

export async function getAllPitchDeckSessions(): Promise<PitchDeckSession[]> {
  const idx = (await kv.get<string[]>("pd:idx")) ?? [];
  if (!idx.length) return [];
  const sessions = await Promise.all(idx.map((id) => kv.get<PitchDeckSession>(`pitchdeck:${id}`)));
  return (sessions.filter(Boolean) as PitchDeckSession[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePitchDeckSession(id: string): Promise<void> {
  await kv.del(`pitchdeck:${id}`);
  const idx = (await kv.get<string[]>("pd:idx")) ?? [];
  await kv.set("pd:idx", idx.filter((i) => i !== id));
}

export async function updatePitchDeckNotes(id: string, adminNotes: string): Promise<void> {
  const session = await getPitchDeckSession(id);
  if (!session) throw new Error("Pitch deck session not found");
  await kv.set(`pitchdeck:${id}`, { ...session, adminNotes }, { ex: SESSION_TTL });
}

export async function getRateLimitCount(ipHash: string): Promise<number> {
  const count = await kv.get<number>(`ratelimit:${ipHash}`);
  return count ?? 0;
}

// Atomically increments and returns new count. Sets 1-hour TTL on first increment.
export async function checkAndIncrementRateLimit(ipHash: string): Promise<number> {
  const key = `ratelimit:${ipHash}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, 3600);
  return count;
}

// Kept for backward compatibility
export async function incrementRateLimit(ipHash: string): Promise<void> {
  await checkAndIncrementRateLimit(ipHash);
}

// Payment replay prevention — orderId is stored for 90 days after first use
export async function isPaymentUsed(orderId: string): Promise<boolean> {
  return (await kv.get(`used_order:${orderId}`)) !== null;
}

export async function markPaymentUsed(orderId: string): Promise<void> {
  await kv.set(`used_order:${orderId}`, 1, { ex: SESSION_TTL });
}

// Generic rate limiter — returns true if request is allowed, false if limit exceeded
export async function checkRateLimit(namespace: string, ipHash: string, limit: number, windowSecs = 3600): Promise<boolean> {
  const key = `ratelimit:${namespace}:${ipHash}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, windowSecs);
  return count <= limit;
}

export async function isCouponUsed(code: string): Promise<boolean> {
  return (await kv.get(`coupon_used:${code}`)) !== null;
}

export async function markCouponUsed(code: string): Promise<void> {
  await kv.set(`coupon_used:${code}`, 1);
}

export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "salt_prevalidation");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Razorpay mode ────────────────────────────────────────────────────────────

export async function getRazorpayMode(): Promise<"test" | "live"> {
  const stored = await kv.get<string>("razorpay:mode");
  if (stored === "live") return "live";
  if (stored === "test") return "test";
  return process.env.PAYMENT_MODE === "live" ? "live" : "test";
}

export async function setRazorpayMode(mode: "test" | "live"): Promise<void> {
  await kv.set("razorpay:mode", mode);
}

// ── Tool pricing ────────────────────────────────────────────────────────────

export type ToolKey = "readiness" | "advisor" | "pitchdeck" | "pitch_practice";
const DEFAULT_PRICE = 99900; // paise
const DEFAULT_PITCH_PRACTICE_PRICE = 299900; // ₹2999

export async function getToolPrice(tool: ToolKey): Promise<number> {
  const stored = await kv.get<number>(`pricing:${tool}`);
  if (stored) return stored;
  return tool === "pitch_practice" ? DEFAULT_PITCH_PRACTICE_PRICE : DEFAULT_PRICE;
}

export async function setToolPrice(tool: ToolKey, amountPaise: number): Promise<void> {
  await kv.set(`pricing:${tool}`, amountPaise);
}

export async function getAllToolPrices(): Promise<Record<ToolKey, number>> {
  const [r, a, p, pp] = await Promise.all([
    kv.get<number>("pricing:readiness"),
    kv.get<number>("pricing:advisor"),
    kv.get<number>("pricing:pitchdeck"),
    kv.get<number>("pricing:pitch_practice"),
  ]);
  return {
    readiness: r ?? DEFAULT_PRICE,
    advisor: a ?? DEFAULT_PRICE,
    pitchdeck: p ?? DEFAULT_PRICE,
    pitch_practice: pp ?? DEFAULT_PITCH_PRACTICE_PRICE,
  };
}

// ── Site control ────────────────────────────────────────────────────────────

export async function isSitePaused(): Promise<boolean> {
  const paused = await kv.get("site:paused");
  if (paused !== true) return false;
  const until = await kv.get<number>("site:pause:until");
  if (until && Date.now() > until) {
    await kv.del("site:paused");
    await kv.del("site:pause:until");
    return false;
  }
  return true;
}

export async function setSitePaused(paused: boolean): Promise<void> {
  if (paused) {
    await kv.set("site:paused", true);
  } else {
    await kv.del("site:paused");
  }
}

// ── Coupon tracking ─────────────────────────────────────────────────────────

export async function incrementCouponUsage(code: string, email: string): Promise<void> {
  const upper = code.toUpperCase();
  const key = `coupon:${upper}`;
  const current = await kv.get<{ count: number; emails: string[] }>(key) ?? { count: 0, emails: [] };
  await kv.set(key, { count: current.count + 1, emails: [...current.emails, email].slice(-100) });
  const idx = (await kv.get<string[]>("coupon:idx")) ?? [];
  if (!idx.includes(upper)) await kv.set("coupon:idx", [...idx, upper]);
}

export async function getCouponUsage(code: string): Promise<{ count: number; emails: string[] }> {
  return (await kv.get<{ count: number; emails: string[] }>(`coupon:${code.toUpperCase()}`)) ?? { count: 0, emails: [] };
}

export async function getAllCouponStats(): Promise<{ code: string; count: number; emails: string[] }[]> {
  const idx = (await kv.get<string[]>("coupon:idx")) ?? [];
  if (!idx.length) return [];
  const results = await Promise.all(
    idx.map(async (code) => {
      const data = await kv.get<{ count: number; emails: string[] }>(`coupon:${code}`) ?? { count: 0, emails: [] };
      return { code, ...data };
    })
  );
  return results.sort((a, b) => b.count - a.count);
}

export async function isEmailCouponUsed(code: string, email: string): Promise<boolean> {
  return (await kv.get(`coupon_email:${code.toUpperCase()}:${email.toLowerCase()}`)) !== null;
}

export async function markEmailCouponUsed(code: string, email: string): Promise<void> {
  await kv.set(`coupon_email:${code.toUpperCase()}:${email.toLowerCase()}`, 1);
}

// ── PWA subscriptions ───────────────────────────────────────────────────────

export type PushSubscription = {
  endpoint: string;
  keys: { auth: string; p256dh: string };
  installedAt: number;
};

export async function savePushSubscription(sub: PushSubscription): Promise<void> {
  const subKey = `pwa:sub:${Buffer.from(sub.endpoint).toString("base64").slice(0, 40)}`;
  await kv.set(subKey, sub, { ex: 365 * 24 * 60 * 60 });
  await kv.incr("pwa:install:count");
  const idx = (await kv.get<string[]>("pwa:idx")) ?? [];
  if (!idx.includes(subKey)) await kv.set("pwa:idx", [...idx, subKey]);
}

export async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  const idx = (await kv.get<string[]>("pwa:idx")) ?? [];
  if (!idx.length) return [];
  const subs = await Promise.all(idx.map((k) => kv.get<PushSubscription>(k)));
  return subs.filter(Boolean) as PushSubscription[];
}

export async function getPWAInstallCount(): Promise<number> {
  return (await kv.get<number>("pwa:install:count")) ?? 0;
}

// ── Users & Referral System ──────────────────────────────────────────────────

const PROFILE_TTL = 5 * 365 * 24 * 60 * 60; // 5 years
const DYNCP_TTL = 90 * 24 * 60 * 60; // 90 days

export type UserProfile = {
  email: string;
  name: string;
  picture?: string;
  referralCode: string;
  referredBy?: string; // referrer's email
  joinedAt: number;
  joinedCouponIssued: boolean;
};

export type DynamicCoupon = {
  code: string;
  discount: number; // percentage
  issuedTo: string; // email
  reason: "referral_joiner" | "referral_converter";
  issuedAt: number;
  expiresAt: number; // ms
  usedAt?: number; // ms
};

function genReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "DBK-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function genCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "REFREE-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function getUser(email: string): Promise<UserProfile | null> {
  return kv.get<UserProfile>(`usr:${email.toLowerCase()}`);
}

export async function createOrGetUser(email: string, name: string, picture?: string): Promise<UserProfile> {
  const existing = await getUser(email);
  if (existing) {
    if (existing.name !== name || existing.picture !== picture) {
      const updated = { ...existing, name, picture };
      await kv.set(`usr:${email.toLowerCase()}`, updated, { ex: PROFILE_TTL });
      return updated;
    }
    return existing;
  }
  let referralCode = genReferralCode();
  while (await kv.get(`rcref:${referralCode}`)) referralCode = genReferralCode();
  const profile: UserProfile = {
    email: email.toLowerCase(),
    name,
    picture,
    referralCode,
    joinedAt: Date.now(),
    joinedCouponIssued: false,
  };
  await kv.set(`usr:${email.toLowerCase()}`, profile, { ex: PROFILE_TTL });
  await kv.set(`rcref:${referralCode}`, email.toLowerCase(), { ex: PROFILE_TTL });
  return profile;
}

async function issueDynamicCoupon(toEmail: string, reason: "referral_joiner" | "referral_converter"): Promise<string> {
  const code = genCouponCode();
  const now = Date.now();
  const coupon: DynamicCoupon = {
    code,
    discount: 100,
    issuedTo: toEmail.toLowerCase(),
    reason,
    issuedAt: now,
    expiresAt: now + DYNCP_TTL * 1000,
  };
  await kv.set(`dyncp:${code}`, coupon, { ex: DYNCP_TTL });
  const existing = await kv.get<string[]>(`ucpns:${toEmail.toLowerCase()}`) ?? [];
  await kv.set(`ucpns:${toEmail.toLowerCase()}`, [...existing, code], { ex: PROFILE_TTL });
  return code;
}

export async function assignReferral(email: string, refCode: string): Promise<void> {
  const user = await getUser(email);
  if (!user || user.referredBy || user.joinedCouponIssued) return;
  const referrerEmail = await kv.get<string>(`rcref:${refCode.toUpperCase()}`);
  if (!referrerEmail || referrerEmail === email.toLowerCase()) return;
  await issueDynamicCoupon(email, "referral_joiner");
  const referredList = await kv.get<string[]>(`rcrl:${referrerEmail}`) ?? [];
  if (!referredList.includes(email.toLowerCase())) {
    await kv.set(`rcrl:${referrerEmail}`, [...referredList, email.toLowerCase()], { ex: PROFILE_TTL });
    // Award first_referral achievement to the referrer when they get their first signup
    if (referredList.length === 0) {
      awardAchievement(referrerEmail, "first_referral").catch(() => {});
    }
  }
  const updated: UserProfile = { ...user, referredBy: referrerEmail, joinedCouponIssued: true };
  await kv.set(`usr:${email.toLowerCase()}`, updated, { ex: PROFILE_TTL });
}

export async function triggerReferralReward(buyerEmail: string): Promise<void> {
  const email = buyerEmail.toLowerCase();
  const user = await getUser(email);
  if (!user?.referredBy) return;
  const rewardKey = `rcrw:${email}`;
  if (await kv.get(rewardKey)) return;
  await kv.set(rewardKey, 1, { ex: PROFILE_TTL });
  await issueDynamicCoupon(user.referredBy, "referral_converter");
  // Award referral_converted achievement to the referrer
  awardAchievement(user.referredBy, "referral_converted").catch(() => {});
}

export async function getDynamicCoupon(code: string): Promise<DynamicCoupon | null> {
  return kv.get<DynamicCoupon>(`dyncp:${code.toUpperCase()}`);
}

export async function markDynamicCouponUsed(code: string): Promise<void> {
  const coupon = await getDynamicCoupon(code);
  if (!coupon) return;
  await kv.set(`dyncp:${code.toUpperCase()}`, { ...coupon, usedAt: Date.now() }, { ex: DYNCP_TTL });
}

export async function getUserCoupons(email: string): Promise<DynamicCoupon[]> {
  const codes = await kv.get<string[]>(`ucpns:${email.toLowerCase()}`) ?? [];
  if (!codes.length) return [];
  const coupons = await Promise.all(codes.map((c) => kv.get<DynamicCoupon>(`dyncp:${c}`)));
  return (coupons.filter(Boolean) as DynamicCoupon[]).sort((a, b) => b.issuedAt - a.issuedAt);
}

export async function getUserReferralStats(email: string): Promise<{ total: number; converted: number }> {
  const referred = await kv.get<string[]>(`rcrl:${email.toLowerCase()}`) ?? [];
  const checks = await Promise.all(referred.map((e) => kv.get(`rcrw:${e}`)));
  return { total: referred.length, converted: checks.filter(Boolean).length };
}

export async function getUserSessionsByEmail(email: string): Promise<{
  readiness: (Session & { report: Report | null })[];
  advisor: AdvisorSession[];
  pitchDeck: PitchDeckSession[];
}> {
  const em = email.toLowerCase();
  const [allSessions, allAdvisor, allPitchDeck] = await Promise.all([
    getAllSessions(),
    getAllAdvisorSessions(),
    getAllPitchDeckSessions(),
  ]);
  const readinessSessions = allSessions.filter((s) => s.email?.toLowerCase() === em && s.status === "completed");
  const reports = await Promise.all(readinessSessions.map((s) => getReport(s.id).catch(() => null)));
  return {
    readiness: readinessSessions.map((s, i) => ({ ...s, report: reports[i] ?? null })),
    advisor: allAdvisor.filter((s) => s.email?.toLowerCase() === em),
    pitchDeck: allPitchDeck.filter((s) => s.email?.toLowerCase() === em),
  };
}

// ── Admin Coupons ──────────────────────────────────────────────────────────────

export type AdminCoupon = {
  code: string;
  name: string;
  discount: number; // 1–99
  maxUses: number | null; // null = unlimited
  usedCount: number;
  usedBy: { email: string; usedAt: number; tool?: string }[];
  createdAt: number;
  expiresAt: number | null; // null = no expiry
  revokedAt?: number;
  forAgent?: string; // agent email, if assigned to a specific agent
};

export async function createAdminCoupon(
  coupon: Omit<AdminCoupon, "usedCount" | "usedBy">
): Promise<void> {
  const full: AdminCoupon = { ...coupon, usedCount: 0, usedBy: [] };
  await kv.set(`adcp:${coupon.code.toUpperCase()}`, full);
  const index = (await kv.get<string[]>("adcp:index")) ?? [];
  if (!index.includes(coupon.code.toUpperCase())) {
    await kv.set("adcp:index", [...index, coupon.code.toUpperCase()]);
  }
  if (coupon.forAgent) {
    const ae = coupon.forAgent.toLowerCase();
    const existing = (await kv.get<string[]>(`agcp:${ae}`)) ?? [];
    if (!existing.includes(coupon.code.toUpperCase())) {
      await kv.set(`agcp:${ae}`, [...existing, coupon.code.toUpperCase()]);
    }
  }
}

export async function getAdminCoupon(code: string): Promise<AdminCoupon | null> {
  return kv.get<AdminCoupon>(`adcp:${code.toUpperCase()}`);
}

export async function getAllAdminCoupons(): Promise<AdminCoupon[]> {
  const index = (await kv.get<string[]>("adcp:index")) ?? [];
  if (!index.length) return [];
  const coupons = await Promise.all(index.map((c) => kv.get<AdminCoupon>(`adcp:${c}`)));
  return (coupons.filter(Boolean) as AdminCoupon[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function useAdminCoupon(code: string, email: string, tool?: string): Promise<void> {
  const coupon = await getAdminCoupon(code);
  if (!coupon) return;
  const updated: AdminCoupon = {
    ...coupon,
    usedCount: coupon.usedCount + 1,
    usedBy: [...coupon.usedBy, { email, usedAt: Date.now(), tool }].slice(-200),
  };
  await kv.set(`adcp:${code.toUpperCase()}`, updated);
}

export async function revokeAdminCoupon(code: string): Promise<void> {
  const coupon = await getAdminCoupon(code);
  if (!coupon) return;
  await kv.set(`adcp:${code.toUpperCase()}`, { ...coupon, revokedAt: Date.now() });
}

export async function getAgentCoupons(agentEmail: string): Promise<AdminCoupon[]> {
  const codes = (await kv.get<string[]>(`agcp:${agentEmail.toLowerCase()}`)) ?? [];
  if (!codes.length) return [];
  const coupons = await Promise.all(codes.map((c) => getAdminCoupon(c)));
  return coupons.filter(Boolean) as AdminCoupon[];
}

// ── Agent System ───────────────────────────────────────────────────────────────

export type AgentProfile = {
  email: string;
  name: string;
  phone: string;
  bio?: string;
  agentCode: string; // AGT-XXXXXX
  status: "pending" | "active" | "banned";
  registeredAt: number;
  approvedAt?: number;
  bannedAt?: number;
  adminNotes?: string;
  subscriptionStatus: "inactive" | "active";
  subscriptionActivatedAt?: number;
  maxCouponDiscount: number; // default 40
};

export type AgentMessage = {
  id: string;
  body: string;
  sentAt: number;
  readAt?: number;
};

export type AgentClientEntry = {
  sessionId: string;
  tool: "readiness" | "advisor" | "pitchdeck";
  amount: number; // paise
  clientEmail?: string;
  clientName?: string;
  createdAt: number;
};

function genAgentCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "AGT-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function getAgent(email: string): Promise<AgentProfile | null> {
  return kv.get<AgentProfile>(`agent:${email.toLowerCase()}`);
}

export async function getAgentEmailByCode(code: string): Promise<string | null> {
  return kv.get<string>(`agent:ref:${code.toUpperCase()}`);
}

export async function getAllAgents(): Promise<AgentProfile[]> {
  const idx = (await kv.get<string[]>("agent:idx")) ?? [];
  if (!idx.length) return [];
  const agents = await Promise.all(idx.map((e) => kv.get<AgentProfile>(`agent:${e}`)));
  return (agents.filter(Boolean) as AgentProfile[]).sort((a, b) => b.registeredAt - a.registeredAt);
}

export async function createAgentProfile(
  data: Pick<AgentProfile, "email" | "name" | "phone" | "bio">
): Promise<AgentProfile> {
  let agentCode = genAgentCode();
  while (await kv.get(`agent:ref:${agentCode}`)) agentCode = genAgentCode();
  const profile: AgentProfile = {
    email: data.email.toLowerCase(),
    name: data.name,
    phone: data.phone,
    bio: data.bio,
    agentCode,
    status: "pending",
    registeredAt: Date.now(),
    subscriptionStatus: "inactive",
    maxCouponDiscount: 40,
  };
  await kv.set(`agent:${data.email.toLowerCase()}`, profile);
  await kv.set(`agent:ref:${agentCode}`, data.email.toLowerCase());
  const idx = (await kv.get<string[]>("agent:idx")) ?? [];
  if (!idx.includes(data.email.toLowerCase())) {
    await kv.set("agent:idx", [...idx, data.email.toLowerCase()]);
  }
  return profile;
}

export async function updateAgentProfile(email: string, updates: Partial<AgentProfile>): Promise<void> {
  const agent = await getAgent(email);
  if (!agent) return;
  await kv.set(`agent:${email.toLowerCase()}`, { ...agent, ...updates });
}

export async function getAgentClients(agentEmail: string): Promise<AgentClientEntry[]> {
  return (await kv.get<AgentClientEntry[]>(`agcl:${agentEmail.toLowerCase()}`)) ?? [];
}

export async function linkSessionToAgent(agentCode: string, entry: AgentClientEntry): Promise<void> {
  const email = await getAgentEmailByCode(agentCode);
  if (!email) return;
  const existing = await getAgentClients(email);
  if (existing.some((e) => e.sessionId === entry.sessionId)) return;
  await kv.set(`agcl:${email}`, [...existing, entry].slice(-500));
  const current = (await kv.get<number>(`agrev:${email}`)) ?? 0;
  await kv.set(`agrev:${email}`, current + entry.amount);
}

export async function getAgentRevenue(agentEmail: string): Promise<number> {
  return (await kv.get<number>(`agrev:${agentEmail.toLowerCase()}`)) ?? 0;
}

export async function getAgentMessages(agentEmail: string): Promise<AgentMessage[]> {
  return (await kv.get<AgentMessage[]>(`agmsg:${agentEmail.toLowerCase()}`)) ?? [];
}

export async function sendAgentMessage(agentEmail: string, body: string): Promise<void> {
  const existing = await getAgentMessages(agentEmail);
  const msg: AgentMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    body,
    sentAt: Date.now(),
  };
  await kv.set(`agmsg:${agentEmail.toLowerCase()}`, [...existing, msg].slice(-100));
}

export async function markAgentMessagesRead(agentEmail: string): Promise<void> {
  const msgs = await getAgentMessages(agentEmail);
  const now = Date.now();
  const needsUpdate = msgs.some((m) => !m.readAt);
  if (!needsUpdate) return;
  await kv.set(`agmsg:${agentEmail.toLowerCase()}`, msgs.map((m) => m.readAt ? m : { ...m, readAt: now }));
}

export async function getAgentSubscriptionPrice(): Promise<number> {
  return (await kv.get<number>("agent:sub:price")) ?? 29900;
}

export async function setAgentSubscriptionPrice(amountPaise: number): Promise<void> {
  await kv.set("agent:sub:price", amountPaise);
}

export async function getAgentRazorpayPlanId(): Promise<string | null> {
  return kv.get<string>("agent:sub:planId");
}

export async function setAgentRazorpayPlanId(planId: string): Promise<void> {
  await kv.set("agent:sub:planId", planId);
}

// ── Platform Pause Timer ───────────────────────────────────────────────────────

export async function getPauseUntil(): Promise<number | null> {
  return kv.get<number>("site:pause:until");
}

export async function setPauseUntil(untilMs: number | null): Promise<void> {
  if (untilMs === null) {
    await kv.del("site:pause:until");
  } else {
    await kv.set("site:pause:until", untilMs);
  }
}

// ── News & Grants Cache ────────────────────────────────────────────────────────

export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
};

export type GrantItem = {
  title: string;
  description: string;
  url: string;
  pubDate: string;
  source: string;
};

const NEWS_TTL = 3600;
const GRANTS_TTL = 6 * 3600;

export async function getCachedNews(): Promise<NewsArticle[] | null> {
  return kv.get<NewsArticle[]>("cache:news");
}

export async function setCachedNews(articles: NewsArticle[]): Promise<void> {
  await kv.set("cache:news", articles, { ex: NEWS_TTL });
}

export async function getCachedGrants(): Promise<GrantItem[] | null> {
  return kv.get<GrantItem[]>("cache:grants");
}

export async function setCachedGrants(items: GrantItem[]): Promise<void> {
  await kv.set("cache:grants", items, { ex: GRANTS_TTL });
}

// ── Brainstorm ─────────────────────────────────────────────────────────────────

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  createdAt: number;
};

export type BrainstormDoc = {
  email: string;
  notes: string;
  todos: TodoItem[];
  updatedAt: number;
};

export async function getBrainstorm(email: string): Promise<BrainstormDoc | null> {
  return kv.get<BrainstormDoc>(`brd:${email.toLowerCase()}`);
}

export async function saveBrainstorm(doc: BrainstormDoc): Promise<void> {
  const key = doc.email.toLowerCase();
  await kv.set(`brd:${key}`, doc, { ex: PROFILE_TTL });
  const idx = (await kv.get<string[]>("brd:idx")) ?? [];
  if (!idx.includes(key)) await kv.set("brd:idx", [...idx, key]);
}

export async function getAllBrainstormDocs(): Promise<BrainstormDoc[]> {
  const idx = (await kv.get<string[]>("brd:idx")) ?? [];
  if (!idx.length) return [];
  const docs = await Promise.all(idx.map((e) => kv.get<BrainstormDoc>(`brd:${e}`)));
  return (docs.filter(Boolean) as BrainstormDoc[]).sort((a, b) => b.updatedAt - a.updatedAt);
}

// ── Blog / Insights ────────────────────────────────────────────────────────────

export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: number;
  updatedAt: number;
  views: number;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const index = (await kv.get<string[]>("blog:idx")) ?? [];
  if (!index.length) return [];
  const posts = await Promise.all(index.map((s) => kv.get<BlogPost>(`blog:${s}`)));
  return (posts.filter(Boolean) as BlogPost[]).sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return kv.get<BlogPost>(`blog:${slug}`);
}

export async function saveBlogPost(post: BlogPost): Promise<void> {
  await kv.set(`blog:${post.slug}`, post);
  const index = (await kv.get<string[]>("blog:idx")) ?? [];
  if (!index.includes(post.slug)) {
    await kv.set("blog:idx", [...index, post.slug]);
  }
}

export async function deleteBlogPost(slug: string): Promise<void> {
  await kv.del(`blog:${slug}`);
  const index = (await kv.get<string[]>("blog:idx")) ?? [];
  await kv.set("blog:idx", index.filter((s) => s !== slug));
}

export async function incrementPostViews(slug: string): Promise<void> {
  const post = await getBlogPost(slug);
  if (!post) return;
  await kv.set(`blog:${post.slug}`, { ...post, views: post.views + 1 });
}

// ── Content Bank ───────────────────────────────────────────────────────────────

export type ContentItem = {
  id: string;
  type: "tip" | "idea";
  body: string;
  tags: string[];
  addedAt: number;
};

export async function getContentItems(type?: "tip" | "idea"): Promise<ContentItem[]> {
  const index = (await kv.get<string[]>("content:idx")) ?? [];
  if (!index.length) return [];
  const items = await Promise.all(index.map((id) => kv.get<ContentItem>(`content:${id}`)));
  const all = items.filter(Boolean) as ContentItem[];
  return type ? all.filter((i) => i.type === type) : all;
}

export async function saveContentItem(item: ContentItem): Promise<void> {
  await kv.set(`content:${item.id}`, item);
  const index = (await kv.get<string[]>("content:idx")) ?? [];
  if (!index.includes(item.id)) {
    await kv.set("content:idx", [...index, item.id]);
  }
}

export async function deleteContentItem(id: string): Promise<void> {
  await kv.del(`content:${id}`);
  const index = (await kv.get<string[]>("content:idx")) ?? [];
  await kv.set("content:idx", index.filter((i) => i !== id));
}

export async function getContentCount(): Promise<{ tips: number; ideas: number }> {
  const all = await getContentItems();
  return { tips: all.filter((i) => i.type === "tip").length, ideas: all.filter((i) => i.type === "idea").length };
}

// ── Matchmaking ────────────────────────────────────────────────────────────────

export type MatchProfile = {
  email: string;
  displayName: string;
  startupName: string;
  stage: "idea" | "mvp" | "revenue" | "scale";
  lookingFor: string[];
  skills: string[];
  bio: string;
  location: string;
  createdAt: number;
  updatedAt: number;
  active: boolean;
};

const MATCH_TTL = 365 * 24 * 60 * 60;
const SWIPE_TTL = 90 * 24 * 60 * 60;

export async function getMatchProfile(email: string): Promise<MatchProfile | null> {
  return kv.get<MatchProfile>(`mp:${email.toLowerCase()}`);
}

export async function saveMatchProfile(profile: MatchProfile): Promise<void> {
  await kv.set(`mp:${profile.email.toLowerCase()}`, profile, { ex: MATCH_TTL });
  const idx = (await kv.get<string[]>("mp:idx")) ?? [];
  if (!idx.includes(profile.email.toLowerCase())) {
    await kv.set("mp:idx", [...idx, profile.email.toLowerCase()], { ex: MATCH_TTL });
  }
}

export async function getAllMatchProfiles(): Promise<MatchProfile[]> {
  const idx = (await kv.get<string[]>("mp:idx")) ?? [];
  if (!idx.length) return [];
  const profiles = await Promise.all(idx.map((e) => kv.get<MatchProfile>(`mp:${e}`)));
  return (profiles.filter(Boolean) as MatchProfile[]).filter((p) => p.active);
}

export async function recordSwipe(swiperEmail: string, targetEmail: string, direction: "like" | "pass"): Promise<{ isMatch: boolean }> {
  const swiperKey = `ml:${swiperEmail.toLowerCase()}`;
  const existing = (await kv.get<Record<string, "like" | "pass">>(swiperKey)) ?? {};
  existing[targetEmail.toLowerCase()] = direction;
  await kv.set(swiperKey, existing, { ex: SWIPE_TTL });

  if (direction === "like") {
    const theirSwipes = (await kv.get<Record<string, "like" | "pass">>(`ml:${targetEmail.toLowerCase()}`)) ?? {};
    if (theirSwipes[swiperEmail.toLowerCase()] === "like") {
      const myMatches = (await kv.get<string[]>(`mm:${swiperEmail.toLowerCase()}`)) ?? [];
      if (!myMatches.includes(targetEmail.toLowerCase())) {
        await kv.set(`mm:${swiperEmail.toLowerCase()}`, [...myMatches, targetEmail.toLowerCase()], { ex: SWIPE_TTL });
      }
      const theirMatches = (await kv.get<string[]>(`mm:${targetEmail.toLowerCase()}`)) ?? [];
      if (!theirMatches.includes(swiperEmail.toLowerCase())) {
        await kv.set(`mm:${targetEmail.toLowerCase()}`, [...theirMatches, swiperEmail.toLowerCase()], { ex: SWIPE_TTL });
      }
      return { isMatch: true };
    }
  }
  return { isMatch: false };
}

export async function getMatches(email: string): Promise<string[]> {
  return (await kv.get<string[]>(`mm:${email.toLowerCase()}`)) ?? [];
}

export async function getSwipedEmails(email: string): Promise<Record<string, "like" | "pass">> {
  return (await kv.get<Record<string, "like" | "pass">>(`ml:${email.toLowerCase()}`)) ?? {};
}

// ── Match Chat ─────────────────────────────────────────────────────────────────

export type ChatMsg = {
  id: string;
  from: string;
  body: string;
  sentAt: number;
};

function chatKey(emailA: string, emailB: string): string {
  const sorted = [emailA.toLowerCase(), emailB.toLowerCase()].sort();
  return `chat:${sorted[0]}:${sorted[1]}`;
}

export async function getChatMessages(emailA: string, emailB: string): Promise<ChatMsg[]> {
  return (await kv.get<ChatMsg[]>(chatKey(emailA, emailB))) ?? [];
}

export async function sendChatMessage(from: string, to: string, body: string): Promise<ChatMsg> {
  const msgs = await getChatMessages(from, to);
  const msg: ChatMsg = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from: from.toLowerCase(),
    body,
    sentAt: Date.now(),
  };
  await kv.set(chatKey(from, to), [...msgs, msg].slice(-500), { ex: SWIPE_TTL });
  return msg;
}

export async function flushChat(emailA: string, emailB: string): Promise<void> {
  await kv.del(chatKey(emailA, emailB));
}

// ── Agent ↔ Client Chat ────────────────────────────────────────────────────────

export type AgentClientMsg = {
  id: string;
  from: string;
  body: string;
  sentAt: number;
  readAt?: number;
};

function agentChatKey(agentEmail: string, clientEmail: string): string {
  return `agchat:${agentEmail.toLowerCase()}:${clientEmail.toLowerCase()}`;
}

export async function getAgentClientMessages(agentEmail: string, clientEmail: string): Promise<AgentClientMsg[]> {
  return (await kv.get<AgentClientMsg[]>(agentChatKey(agentEmail, clientEmail))) ?? [];
}

export async function sendAgentClientMessage(agentEmail: string, clientEmail: string, from: string, body: string): Promise<AgentClientMsg> {
  const msgs = await getAgentClientMessages(agentEmail, clientEmail);
  const msg: AgentClientMsg = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from,
    body,
    sentAt: Date.now(),
  };
  await kv.set(agentChatKey(agentEmail, clientEmail), [...msgs, msg].slice(-200), { ex: PROFILE_TTL });
  const agConvKey = `agchat:idx:${agentEmail.toLowerCase()}`;
  const agConvs = (await kv.get<string[]>(agConvKey)) ?? [];
  if (!agConvs.includes(clientEmail.toLowerCase())) {
    await kv.set(agConvKey, [...agConvs, clientEmail.toLowerCase()], { ex: PROFILE_TTL });
  }
  return msg;
}

export async function markAgentClientMessagesRead(agentEmail: string, clientEmail: string, readerEmail: string): Promise<void> {
  const msgs = await getAgentClientMessages(agentEmail, clientEmail);
  const now = Date.now();
  const updated = msgs.map((m) => (m.from !== readerEmail && !m.readAt ? { ...m, readAt: now } : m));
  if (updated.some((m, i) => m.readAt !== msgs[i].readAt)) {
    await kv.set(agentChatKey(agentEmail, clientEmail), updated, { ex: PROFILE_TTL });
  }
}

export async function getAgentConversations(agentEmail: string): Promise<{ clientEmail: string; lastMsg: AgentClientMsg | null; unread: number }[]> {
  const clients = (await kv.get<string[]>(`agchat:idx:${agentEmail.toLowerCase()}`)) ?? [];
  return Promise.all(
    clients.map(async (clientEmail) => {
      const msgs = await getAgentClientMessages(agentEmail, clientEmail);
      return {
        clientEmail,
        lastMsg: msgs.length ? msgs[msgs.length - 1] : null,
        unread: msgs.filter((m) => m.from !== agentEmail && !m.readAt).length,
      };
    })
  );
}

// ── Enhanced Ban System ────────────────────────────────────────────────────────

export type BanRecord = {
  email: string;
  reason: string;
  bannedAt: number;
  bannedUntil: number | null;
  active: boolean;
};

export async function banUser(email: string, reason: string, durationHours?: number): Promise<void> {
  const record: BanRecord = {
    email: email.toLowerCase(),
    reason,
    bannedAt: Date.now(),
    bannedUntil: durationHours ? Date.now() + durationHours * 3600 * 1000 : null,
    active: true,
  };
  await kv.set(`ban:${email.toLowerCase()}`, record);
  const idx = (await kv.get<string[]>("ban:idx")) ?? [];
  if (!idx.includes(email.toLowerCase())) {
    await kv.set("ban:idx", [...idx, email.toLowerCase()]);
  }
}

export async function unbanUser(email: string): Promise<void> {
  const ban = await getBan(email);
  if (ban) await kv.set(`ban:${email.toLowerCase()}`, { ...ban, active: false });
}

export async function getBan(email: string): Promise<BanRecord | null> {
  const ban = await kv.get<BanRecord>(`ban:${email.toLowerCase()}`);
  if (!ban) return null;
  if (ban.bannedUntil && Date.now() > ban.bannedUntil && ban.active) {
    const expired = { ...ban, active: false };
    await kv.set(`ban:${email.toLowerCase()}`, expired);
    return expired;
  }
  return ban;
}

export async function getAllBans(): Promise<BanRecord[]> {
  const idx = (await kv.get<string[]>("ban:idx")) ?? [];
  if (!idx.length) return [];
  const bans = await Promise.all(idx.map((e) => kv.get<BanRecord>(`ban:${e}`)));
  return (bans.filter(Boolean) as BanRecord[]).sort((a, b) => b.bannedAt - a.bannedAt);
}

export async function isUserBanned(email: string): Promise<boolean> {
  const ban = await getBan(email);
  return ban?.active === true;
}

// ── Pitch Practice ─────────────────────────────────────────────────────────────

export type PitchPracticeExchange = {
  question: string;
  answer: string;
};

export type PitchPracticeScore = {
  overall: number; // 1–10
  strongestMoment: string;
  weakestMoment: string;
  improvements: string[];
  verdict: string;
};

export type PitchPracticeSession = {
  id: string;
  email: string;
  founderName: string;
  startupName: string;
  oneLiner: string;
  investorType: "angel" | "seed_vc" | "series_a_vc";
  exchanges: PitchPracticeExchange[];
  score: PitchPracticeScore | null;
  payment: { orderId: string; paymentId: string; amount: number; isFree: boolean } | null;
  createdAt: number;
  completedAt: number | null;
};

const PP_TTL = 365 * 24 * 3600; // 1 year

export async function getPitchPracticeCount(email: string): Promise<number> {
  return (await kv.get<number>(`pp:count:${email.toLowerCase()}`)) ?? 0;
}

export async function incrementPitchPracticeCount(email: string): Promise<void> {
  const count = await getPitchPracticeCount(email);
  await kv.set(`pp:count:${email.toLowerCase()}`, count + 1);
}

export async function savePitchPracticeSession(session: PitchPracticeSession): Promise<void> {
  await kv.set(`pp:${session.id}`, session, { ex: PP_TTL });
  const idx = (await kv.get<string[]>("pp:idx")) ?? [];
  if (!idx.includes(session.id)) await kv.set("pp:idx", [session.id, ...idx].slice(0, 500));
}

export async function getPitchPracticeSession(id: string): Promise<PitchPracticeSession | null> {
  return kv.get<PitchPracticeSession>(`pp:${id}`);
}

export async function getAllPitchPracticeSessions(): Promise<PitchPracticeSession[]> {
  const idx = (await kv.get<string[]>("pp:idx")) ?? [];
  if (!idx.length) return [];
  const sessions = await Promise.all(idx.map((id) => kv.get<PitchPracticeSession>(`pp:${id}`)));
  return (sessions.filter(Boolean) as PitchPracticeSession[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function isPitchPaymentUsed(orderId: string): Promise<boolean> {
  return (await kv.get<boolean>(`pp:paid:${orderId}`)) === true;
}

export async function markPitchPaymentUsed(orderId: string): Promise<void> {
  await kv.set(`pp:paid:${orderId}`, true, { ex: PP_TTL });
}

// ── Share Tokens ───────────────────────────────────────────────────────────────

export type ShareTokenData = {
  sessionId: string;
  founderName: string;
  startupIdea: string;
  email: string;
  createdAt: number;
};

const SHARE_TTL = 30 * 24 * 3600; // 30 days

export async function createShareToken(
  sessionId: string,
  founderName: string,
  startupIdea: string,
  email: string
): Promise<string> {
  const token = crypto.randomBytes(12).toString("base64url");
  await kv.set(`share:${token}`, { sessionId, founderName, startupIdea, email, createdAt: Date.now() }, { ex: SHARE_TTL });
  return token;
}

export async function getShareToken(token: string): Promise<ShareTokenData | null> {
  return kv.get<ShareTokenData>(`share:${token}`);
}

// ── Score History ──────────────────────────────────────────────────────────────

export type ScoreHistoryEntry = {
  score: number;
  verdict: string;
  sessionId: string;
  recordedAt: number;
};

export async function recordScoreHistory(email: string, entry: ScoreHistoryEntry): Promise<void> {
  const key = `scorehist:${email.toLowerCase()}`;
  const history = (await kv.get<ScoreHistoryEntry[]>(key)) ?? [];
  history.push(entry);
  await kv.set(key, history.slice(-24), { ex: 2 * 365 * 24 * 3600 }); // keep last 24, 2yr TTL
}

export async function getScoreHistory(email: string): Promise<ScoreHistoryEntry[]> {
  return (await kv.get<ScoreHistoryEntry[]>(`scorehist:${email.toLowerCase()}`)) ?? [];
}

// ── Weekly Journal ─────────────────────────────────────────────────────────────

export type JournalEntry = {
  weekKey: string; // "2025-W21"
  shipped: string;
  learned: string;
  blocker: string;
  savedAt: number;
};

export async function saveJournalEntry(email: string, entry: JournalEntry): Promise<void> {
  await kv.set(`journal:${email.toLowerCase()}:${entry.weekKey}`, entry, { ex: 365 * 24 * 3600 });
  const idx = (await kv.get<string[]>(`journal:idx:${email.toLowerCase()}`)) ?? [];
  if (!idx.includes(entry.weekKey)) {
    await kv.set(`journal:idx:${email.toLowerCase()}`, [entry.weekKey, ...idx].slice(0, 52));
  }
}

export async function getJournalEntries(email: string): Promise<JournalEntry[]> {
  const idx = (await kv.get<string[]>(`journal:idx:${email.toLowerCase()}`)) ?? [];
  if (!idx.length) return [];
  const entries = await Promise.all(
    idx.map((wk) => kv.get<JournalEntry>(`journal:${email.toLowerCase()}:${wk}`))
  );
  return (entries.filter(Boolean) as JournalEntry[]).sort((a, b) => b.savedAt - a.savedAt);
}

// ── Investor CRM ───────────────────────────────────────────────────────────────

export type InvestorContact = {
  id: string;
  name: string;
  firm: string;
  email?: string;
  linkedIn?: string;
  stage: string; // angel, seed, series_a, etc.
  status: "to_contact" | "contacted" | "meeting_scheduled" | "passed" | "term_sheet";
  contactedOn?: number;
  followUpOn?: number;
  notes: string;
  addedAt: number;
  updatedAt: number;
};

export async function getInvestorCRM(email: string): Promise<InvestorContact[]> {
  return (await kv.get<InvestorContact[]>(`crm:${email.toLowerCase()}`)) ?? [];
}

export async function saveInvestorCRM(email: string, contacts: InvestorContact[]): Promise<void> {
  await kv.set(`crm:${email.toLowerCase()}`, contacts, { ex: 2 * 365 * 24 * 3600 });
}

// ── Founder Feed ───────────────────────────────────────────────────────────────

export type FeedPost = {
  id: string;
  body: string;
  category: "win" | "learning" | "question" | "milestone";
  stage?: string;
  reactions: { fire: number; clap: number; think: number };
  createdAt: number;
  // deliberately no email — anonymous
};

const FEED_TTL = 90 * 24 * 3600;

export async function createFeedPost(post: FeedPost): Promise<void> {
  await kv.set(`feed:${post.id}`, post, { ex: FEED_TTL });
  const idx = (await kv.get<string[]>("feed:idx")) ?? [];
  await kv.set("feed:idx", [post.id, ...idx].slice(0, 200));
  await kv.del("feed:cache:30");
}

const FEED_CACHE_TTL = 5 * 60; // 5 minutes in KV seconds

export async function getFeedPosts(limit = 30): Promise<FeedPost[]> {
  const cacheKey = `feed:cache:${limit}`;
  const cached = await kv.get<FeedPost[]>(cacheKey);
  if (cached) return cached;
  const idx = (await kv.get<string[]>("feed:idx")) ?? [];
  if (!idx.length) return [];
  const posts = await Promise.all(idx.slice(0, limit).map((id) => kv.get<FeedPost>(`feed:${id}`)));
  const result = (posts.filter(Boolean) as FeedPost[]).sort((a, b) => b.createdAt - a.createdAt);
  await kv.set(cacheKey, result, { ex: FEED_CACHE_TTL });
  return result;
}

export async function reactToPost(postId: string, reaction: "fire" | "clap" | "think"): Promise<void> {
  const post = await kv.get<FeedPost>(`feed:${postId}`);
  if (!post) return;
  post.reactions[reaction] = (post.reactions[reaction] ?? 0) + 1;
  await kv.set(`feed:${postId}`, post, { ex: FEED_TTL });
  await kv.del("feed:cache:30");
}

// ── Global AI Feature Pricing ──────────────────────────────────────────────────

const DEFAULT_AI_FEATURE_PRICE = 299900; // ₹2999

export async function getAIFeaturePrice(): Promise<number> {
  return (await kv.get<number>("pricing:ai_feature")) ?? DEFAULT_AI_FEATURE_PRICE;
}

export async function setAIFeaturePrice(amountPaise: number): Promise<void> {
  await kv.set("pricing:ai_feature", amountPaise);
}

export async function getAIFeatureUsageCount(email: string, feature: string): Promise<number> {
  return (await kv.get<number>(`ai_use:${email.toLowerCase()}:${feature}`)) ?? 0;
}

export async function incrementAIFeatureUsage(email: string, feature: string): Promise<void> {
  const key = `ai_use:${email.toLowerCase()}:${feature}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, 5 * 365 * 24 * 3600);
}

// ── Payment Gate ───────────────────────────────────────────────────────────────

export type PaymentGate = "open" | "early_access" | "live";

export async function getPaymentGate(): Promise<PaymentGate> {
  return (await kv.get<PaymentGate>("payment:gate")) ?? "early_access";
}

export async function setPaymentGate(gate: PaymentGate): Promise<void> {
  await kv.set("payment:gate", gate);
}

// ── Per-user Session Index ─────────────────────────────────────────────────────

export async function addUserSessionRef(email: string, sessionId: string, tool: "readiness" | "advisor" | "pitchdeck"): Promise<void> {
  const key = `user:sess:${email.toLowerCase()}`;
  const existing = (await kv.get<{ id: string; tool: string }[]>(key)) ?? [];
  if (!existing.find((e) => e.id === sessionId)) {
    await kv.set(key, [{ id: sessionId, tool }, ...existing].slice(0, 200), { ex: 5 * 365 * 24 * 3600 });
  }
}

export async function getUserSessionRefs(email: string): Promise<{ id: string; tool: string }[]> {
  return (await kv.get<{ id: string; tool: string }[]>(`user:sess:${email.toLowerCase()}`)) ?? [];
}

// ── Questionnaire Save State ───────────────────────────────────────────────────

export type QuestionnaireProgress = {
  sessionId: string;
  answers: Record<string, string>;
  currentPhase: number;
  savedAt: number;
};

export async function saveQuestionnaireProgress(sessionId: string, progress: QuestionnaireProgress): Promise<void> {
  await kv.set(`qprog:${sessionId}`, progress, { ex: 7 * 24 * 3600 });
}

export async function getQuestionnaireProgress(sessionId: string): Promise<QuestionnaireProgress | null> {
  return kv.get<QuestionnaireProgress>(`qprog:${sessionId}`);
}

export async function clearQuestionnaireProgress(sessionId: string): Promise<void> {
  await kv.del(`qprog:${sessionId}`);
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export type AuditEntry = {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: number;
};

export async function addAuditEntry(adminEmail: string, action: string, details: string): Promise<void> {
  const entry: AuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    adminEmail,
    action,
    details,
    timestamp: Date.now(),
  };
  const existing = (await kv.get<AuditEntry[]>("audit:log")) ?? [];
  await kv.set("audit:log", [entry, ...existing].slice(0, 1000));
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  return (await kv.get<AuditEntry[]>("audit:log")) ?? [];
}

// ── NPS Survey ────────────────────────────────────────────────────────────────

export type NPSEntry = {
  email?: string;
  score: number;
  comment?: string;
  tool: string;
  submittedAt: number;
};

export async function saveNPS(entry: NPSEntry): Promise<void> {
  const existing = (await kv.get<NPSEntry[]>("nps:entries")) ?? [];
  await kv.set("nps:entries", [entry, ...existing].slice(0, 5000));
}

export async function getAllNPS(): Promise<NPSEntry[]> {
  return (await kv.get<NPSEntry[]>("nps:entries")) ?? [];
}

export async function hasSubmittedNPS(email: string, tool: string): Promise<boolean> {
  return (await kv.get(`nps:done:${email.toLowerCase()}:${tool}`)) !== null;
}

export async function markNPSSubmitted(email: string, tool: string): Promise<void> {
  await kv.set(`nps:done:${email.toLowerCase()}:${tool}`, 1, { ex: 90 * 24 * 3600 });
}

// ── In-app Feedback ───────────────────────────────────────────────────────────

export type FeedbackEntry = {
  id: string;
  email?: string;
  type: "bug" | "feature" | "other";
  body: string;
  page: string;
  submittedAt: number;
  resolved: boolean;
};

export async function saveFeedback(entry: Omit<FeedbackEntry, "id" | "resolved">): Promise<void> {
  const full: FeedbackEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    resolved: false,
  };
  const existing = (await kv.get<FeedbackEntry[]>("feedback:entries")) ?? [];
  await kv.set("feedback:entries", [full, ...existing].slice(0, 2000));
}

export async function getAllFeedback(): Promise<FeedbackEntry[]> {
  return (await kv.get<FeedbackEntry[]>("feedback:entries")) ?? [];
}

export async function resolveFeedback(id: string): Promise<void> {
  const entries = await getAllFeedback();
  await kv.set("feedback:entries", entries.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
}

// ── Article Bookmarks ─────────────────────────────────────────────────────────

export async function addBookmark(email: string, slug: string): Promise<void> {
  const key = `bookmarks:${email.toLowerCase()}`;
  const existing = (await kv.get<string[]>(key)) ?? [];
  if (!existing.includes(slug)) {
    await kv.set(key, [slug, ...existing].slice(0, 200), { ex: 5 * 365 * 24 * 3600 });
  }
}

export async function removeBookmark(email: string, slug: string): Promise<void> {
  const key = `bookmarks:${email.toLowerCase()}`;
  const existing = (await kv.get<string[]>(key)) ?? [];
  await kv.set(key, existing.filter((s) => s !== slug), { ex: 5 * 365 * 24 * 3600 });
}

export async function getBookmarks(email: string): Promise<string[]> {
  return (await kv.get<string[]>(`bookmarks:${email.toLowerCase()}`)) ?? [];
}

// ── Startup DNA Quiz ──────────────────────────────────────────────────────────

export type DNAArchetype = "Visionary" | "Executor" | "Networker" | "Builder";

export type DNAResult = {
  archetype: DNAArchetype;
  scores: { visionary: number; executor: number; networker: number; builder: number };
  takenAt: number;
};

export async function saveDNAResult(email: string, result: DNAResult): Promise<void> {
  await kv.set(`dna:${email.toLowerCase()}`, result, { ex: 5 * 365 * 24 * 3600 });
}

export async function getDNAResult(email: string): Promise<DNAResult | null> {
  return kv.get<DNAResult>(`dna:${email.toLowerCase()}`);
}

// ── Job Board ─────────────────────────────────────────────────────────────────

export type JobListing = {
  id: string;
  title: string;
  company: string;
  posterEmail: string;
  type: "full_time" | "part_time" | "contract" | "co_founder" | "intern";
  remote: boolean;
  location?: string;
  description: string;
  skills: string[];
  equity?: string;
  salary?: string;
  applyUrl?: string;
  applyEmail?: string;
  postedAt: number;
  expiresAt: number;
  active: boolean;
};

const JOB_TTL = 30 * 24 * 3600;

export async function createJobListing(job: Omit<JobListing, "id" | "postedAt" | "expiresAt" | "active">): Promise<JobListing> {
  const full: JobListing = {
    ...job,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    postedAt: Date.now(),
    expiresAt: Date.now() + JOB_TTL * 1000,
    active: true,
  };
  await kv.set(`job:${full.id}`, full, { ex: JOB_TTL });
  const idx = (await kv.get<string[]>("job:idx")) ?? [];
  await kv.set("job:idx", [full.id, ...idx].slice(0, 500));
  return full;
}

export async function getAllJobListings(): Promise<JobListing[]> {
  const idx = (await kv.get<string[]>("job:idx")) ?? [];
  if (!idx.length) return [];
  const jobs = await Promise.all(idx.map((id) => kv.get<JobListing>(`job:${id}`)));
  return (jobs.filter(Boolean) as JobListing[]).filter((j) => j.active && j.expiresAt > Date.now());
}

export async function deleteJobListing(id: string): Promise<void> {
  const job = await kv.get<JobListing>(`job:${id}`);
  if (job) await kv.set(`job:${id}`, { ...job, active: false }, { ex: JOB_TTL });
}

export async function getUserJobListings(email: string): Promise<JobListing[]> {
  const all = await getAllJobListings();
  return all.filter((j) => j.posterEmail.toLowerCase() === email.toLowerCase());
}

// ── Service Provider Directory ─────────────────────────────────────────────────

export type ServiceProvider = {
  id: string;
  name: string;
  category: "legal" | "finance" | "design" | "development" | "marketing" | "hr" | "other";
  speciality: string;
  location: string;
  bio: string;
  website?: string;
  email: string;
  verified: boolean;
  addedAt: number;
};

export async function createServiceProvider(provider: Omit<ServiceProvider, "id" | "addedAt" | "verified">): Promise<ServiceProvider> {
  const full: ServiceProvider = {
    ...provider,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    verified: false,
    addedAt: Date.now(),
  };
  await kv.set(`svc:${full.id}`, full);
  const idx = (await kv.get<string[]>("svc:idx")) ?? [];
  await kv.set("svc:idx", [...idx, full.id]);
  return full;
}

export async function getAllServiceProviders(): Promise<ServiceProvider[]> {
  const idx = (await kv.get<string[]>("svc:idx")) ?? [];
  if (!idx.length) return [];
  const providers = await Promise.all(idx.map((id) => kv.get<ServiceProvider>(`svc:${id}`)));
  return providers.filter(Boolean) as ServiceProvider[];
}

export async function verifyServiceProvider(id: string): Promise<void> {
  const p = await kv.get<ServiceProvider>(`svc:${id}`);
  if (p) await kv.set(`svc:${id}`, { ...p, verified: true });
}

export async function deleteServiceProvider(id: string): Promise<void> {
  await kv.del(`svc:${id}`);
  const idx = (await kv.get<string[]>("svc:idx")) ?? [];
  await kv.set("svc:idx", idx.filter((i) => i !== id));
}

// ── Buddy System ──────────────────────────────────────────────────────────────

export type BuddyRequest = {
  id: string;
  email: string;
  name: string;
  stage: string;
  sector: string;
  lookingFor: string;
  bio: string;
  createdAt: number;
  matchedWith?: string;
};

export async function createBuddyRequest(req: Omit<BuddyRequest, "id" | "createdAt">): Promise<BuddyRequest> {
  const full: BuddyRequest = {
    ...req,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  await kv.set(`buddy:${req.email.toLowerCase()}`, full, { ex: 90 * 24 * 3600 });
  const idx = (await kv.get<string[]>("buddy:idx")) ?? [];
  if (!idx.includes(req.email.toLowerCase())) {
    await kv.set("buddy:idx", [...idx, req.email.toLowerCase()]);
  }
  return full;
}

export async function getBuddyRequest(email: string): Promise<BuddyRequest | null> {
  return kv.get<BuddyRequest>(`buddy:${email.toLowerCase()}`);
}

export async function getAllBuddyRequests(): Promise<BuddyRequest[]> {
  const idx = (await kv.get<string[]>("buddy:idx")) ?? [];
  if (!idx.length) return [];
  const reqs = await Promise.all(idx.map((e) => kv.get<BuddyRequest>(`buddy:${e}`)));
  return (reqs.filter(Boolean) as BuddyRequest[]).filter((r) => !r.matchedWith);
}

export async function matchBuddies(emailA: string, emailB: string): Promise<void> {
  const [a, b] = await Promise.all([getBuddyRequest(emailA), getBuddyRequest(emailB)]);
  if (a) await kv.set(`buddy:${emailA.toLowerCase()}`, { ...a, matchedWith: emailB }, { ex: 90 * 24 * 3600 });
  if (b) await kv.set(`buddy:${emailB.toLowerCase()}`, { ...b, matchedWith: emailA }, { ex: 90 * 24 * 3600 });
}

// ── Demo Day ──────────────────────────────────────────────────────────────────

export type DemoDayEntry = {
  id: string;
  email: string;
  founderName: string;
  startupName: string;
  oneLiner: string;
  videoUrl?: string;
  readinessScore?: number;
  votes: number;
  submittedAt: number;
  month: string;
};

export async function submitDemoDayEntry(entry: Omit<DemoDayEntry, "id" | "votes" | "submittedAt">): Promise<DemoDayEntry> {
  const full: DemoDayEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    votes: 0,
    submittedAt: Date.now(),
  };
  await kv.set(`demo:${full.id}`, full, { ex: 60 * 24 * 3600 });
  const idx = (await kv.get<string[]>(`demo:idx:${entry.month}`)) ?? [];
  await kv.set(`demo:idx:${entry.month}`, [full.id, ...idx]);
  return full;
}

export async function getDemoDayEntries(month: string): Promise<DemoDayEntry[]> {
  const idx = (await kv.get<string[]>(`demo:idx:${month}`)) ?? [];
  if (!idx.length) return [];
  const entries = await Promise.all(idx.map((id) => kv.get<DemoDayEntry>(`demo:${id}`)));
  return (entries.filter(Boolean) as DemoDayEntry[]).sort((a, b) => b.votes - a.votes);
}

export async function voteDemoEntry(id: string, voterEmail: string): Promise<void> {
  const voteKey = `demo:vote:${id}:${voterEmail.toLowerCase()}`;
  if (await kv.get(voteKey)) return;
  await kv.set(voteKey, 1, { ex: 60 * 24 * 3600 });
  const entry = await kv.get<DemoDayEntry>(`demo:${id}`);
  if (!entry) return;
  await kv.set(`demo:${id}`, { ...entry, votes: entry.votes + 1 }, { ex: 60 * 24 * 3600 });
}

export async function deleteDemoDayEntry(id: string): Promise<void> {
  const entry = await kv.get<DemoDayEntry>(`demo:${id}`);
  if (!entry) return;
  await kv.del(`demo:${id}`);
  const idx = (await kv.get<string[]>(`demo:idx:${entry.month}`)) ?? [];
  await kv.set(`demo:idx:${entry.month}`, idx.filter((i) => i !== id));
}

export async function getAllDemoDayEntriesAdmin(month: string): Promise<DemoDayEntry[]> {
  const idx = (await kv.get<string[]>(`demo:idx:${month}`)) ?? [];
  if (!idx.length) return [];
  const entries = await Promise.all(idx.map((id) => kv.get<DemoDayEntry>(`demo:${id}`)));
  return (entries.filter(Boolean) as DemoDayEntry[]).sort((a, b) => b.votes - a.votes);
}

// ── Pitch Competition Calendar ─────────────────────────────────────────────────

export type PitchCompetition = {
  id: string;
  name: string;
  organizer: string;
  deadline: number;
  eventDate?: number;
  prize?: string;
  location: string;
  url: string;
  sector?: string;
  stage?: string;
  addedAt: number;
};

export async function savePitchCompetition(comp: Omit<PitchCompetition, "id" | "addedAt">): Promise<PitchCompetition> {
  const full: PitchCompetition = {
    ...comp,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    addedAt: Date.now(),
  };
  await kv.set(`pitchcomp:${full.id}`, full, { ex: 365 * 24 * 3600 });
  const idx = (await kv.get<string[]>("pitchcomp:idx")) ?? [];
  await kv.set("pitchcomp:idx", [full.id, ...idx]);
  return full;
}

export async function getAllPitchCompetitions(): Promise<PitchCompetition[]> {
  const idx = (await kv.get<string[]>("pitchcomp:idx")) ?? [];
  if (!idx.length) return [];
  const comps = await Promise.all(idx.map((id) => kv.get<PitchCompetition>(`pitchcomp:${id}`)));
  return (comps.filter(Boolean) as PitchCompetition[])
    .filter((c) => c.deadline > Date.now())
    .sort((a, b) => a.deadline - b.deadline);
}

export async function deletePitchCompetition(id: string): Promise<void> {
  await kv.del(`pitchcomp:${id}`);
  const idx = (await kv.get<string[]>("pitchcomp:idx")) ?? [];
  await kv.set("pitchcomp:idx", idx.filter((i) => i !== id));
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export const ALL_FLAGS = ["buddy_system", "demo_day", "job_board", "service_directory", "expert_hours", "dna_quiz"] as const;
export type FeatureFlag = typeof ALL_FLAGS[number];

export async function getFeatureFlag(flag: FeatureFlag): Promise<boolean> {
  return (await kv.get<boolean>(`flag:${flag}`)) ?? false;
}

export async function setFeatureFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
  await kv.set(`flag:${flag}`, enabled);
}

export async function getAllFeatureFlags(): Promise<Record<string, boolean>> {
  const values = await Promise.all(ALL_FLAGS.map((f) => kv.get<boolean>(`flag:${f}`)));
  return Object.fromEntries(ALL_FLAGS.map((f, i) => [f, values[i] ?? false]));
}

// ── Revenue Goal ──────────────────────────────────────────────────────────────

export async function setRevenueGoal(month: string, amountPaise: number): Promise<void> {
  await kv.set(`revgoal:${month}`, amountPaise);
}

export async function getRevenueGoal(month: string): Promise<number | null> {
  return kv.get<number>(`revgoal:${month}`);
}

// ── Onboarding Progress ───────────────────────────────────────────────────────

export const ONBOARDING_STEPS = ["first_eval", "joined_feed", "set_crm", "wrote_journal", "set_match_profile"] as const;
export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export async function completeOnboardingStep(email: string, step: OnboardingStep): Promise<void> {
  const key = `onboard:${email.toLowerCase()}`;
  const done = (await kv.get<string[]>(key)) ?? [];
  if (!done.includes(step)) {
    await kv.set(key, [...done, step], { ex: 5 * 365 * 24 * 3600 });
  }
}

export async function getOnboardingProgress(email: string): Promise<OnboardingStep[]> {
  return ((await kv.get<string[]>(`onboard:${email.toLowerCase()}`)) ?? []) as OnboardingStep[];
}

// ── GST Invoice ───────────────────────────────────────────────────────────────

export type GSTInvoice = {
  invoiceNo: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerGST?: string;
  buyerAddress?: string;
  tool: string;
  amountPaise: number;
  gstPaise: number;
  totalPaise: number;
  issuedAt: number;
};

export async function getNextInvoiceNo(): Promise<string> {
  const counter = await kv.incr("gst:counter");
  const year = new Date().getFullYear();
  return `DBK-${year}-${String(counter).padStart(4, "0")}`;
}

export async function saveGSTInvoice(invoice: GSTInvoice): Promise<void> {
  await kv.set(`gst:${invoice.orderId}`, invoice, { ex: 7 * 365 * 24 * 3600 });
}

export async function getGSTInvoice(orderId: string): Promise<GSTInvoice | null> {
  return kv.get<GSTInvoice>(`gst:${orderId}`);
}

// ── Expert Office Hours ───────────────────────────────────────────────────────

export type ExpertSlot = {
  id: string;
  expertEmail: string;
  expertName: string;
  bio: string;
  expertise: string[];
  bookingUrl: string;
  feePaise: number;
  active: boolean;
  addedAt: number;
};

export async function saveExpertSlot(slot: Omit<ExpertSlot, "id" | "addedAt">): Promise<ExpertSlot> {
  const full: ExpertSlot = {
    ...slot,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    addedAt: Date.now(),
  };
  await kv.set(`expert:${full.id}`, full);
  const idx = (await kv.get<string[]>("expert:idx")) ?? [];
  await kv.set("expert:idx", [...idx, full.id]);
  return full;
}

export async function getAllExpertSlots(): Promise<ExpertSlot[]> {
  const idx = (await kv.get<string[]>("expert:idx")) ?? [];
  if (!idx.length) return [];
  const slots = await Promise.all(idx.map((id) => kv.get<ExpertSlot>(`expert:${id}`)));
  return (slots.filter(Boolean) as ExpertSlot[]).filter((s) => s.active);
}

export async function deleteExpertSlot(id: string): Promise<void> {
  const s = await kv.get<ExpertSlot>(`expert:${id}`);
  if (s) await kv.set(`expert:${id}`, { ...s, active: false });
}

// ── Announcement ──────────────────────────────────────────────────────────────

export type Announcement = {
  message: string;
  type: "info" | "warning" | "success";
  active: boolean;
  setAt: number;
};

export async function setAnnouncement(message: string, type: Announcement["type"]): Promise<void> {
  await kv.set("announcement", { message, type, active: true, setAt: Date.now() });
}

export async function clearAnnouncement(): Promise<void> {
  await kv.del("announcement");
}

export async function getAnnouncement(): Promise<Announcement | null> {
  return kv.get<Announcement>("announcement");
}

// ── Founder Circles ───────────────────────────────────────────────────────────

export type FounderCircle = {
  id: string;
  name: string;
  sector: string;
  stage: string;
  members: string[];
  maxMembers: number;
  createdAt: number;
};

export async function createFounderCircle(data: Omit<FounderCircle, "id" | "members" | "createdAt">): Promise<FounderCircle> {
  const circle: FounderCircle = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    members: [],
    createdAt: Date.now(),
  };
  await kv.set(`circle:${circle.id}`, circle);
  const idx = (await kv.get<string[]>("circle:idx")) ?? [];
  await kv.set("circle:idx", [...idx, circle.id]);
  return circle;
}

export async function joinFounderCircle(circleId: string, email: string): Promise<boolean> {
  const circle = await kv.get<FounderCircle>(`circle:${circleId}`);
  if (!circle || circle.members.length >= circle.maxMembers) return false;
  if (!circle.members.includes(email.toLowerCase())) {
    await kv.set(`circle:${circleId}`, { ...circle, members: [...circle.members, email.toLowerCase()] });
  }
  return true;
}

export async function getAllFounderCircles(): Promise<FounderCircle[]> {
  const idx = (await kv.get<string[]>("circle:idx")) ?? [];
  if (!idx.length) return [];
  const circles = await Promise.all(idx.map((id) => kv.get<FounderCircle>(`circle:${id}`)));
  return circles.filter(Boolean) as FounderCircle[];
}

export async function deleteFounderCircle(id: string): Promise<void> {
  await kv.del(`circle:${id}`);
  const idx = (await kv.get<string[]>("circle:idx")) ?? [];
  await kv.set("circle:idx", idx.filter((i) => i !== id));
}

export async function getAllExpertSlotsAdmin(): Promise<ExpertSlot[]> {
  const idx = (await kv.get<string[]>("expert:idx")) ?? [];
  if (!idx.length) return [];
  const slots = await Promise.all(idx.map((id) => kv.get<ExpertSlot>(`expert:${id}`)));
  return (slots.filter(Boolean) as ExpertSlot[]).sort((a, b) => b.addedAt - a.addedAt);
}

export async function getAllPitchCompetitionsAdmin(): Promise<PitchCompetition[]> {
  const idx = (await kv.get<string[]>("pitchcomp:idx")) ?? [];
  if (!idx.length) return [];
  const comps = await Promise.all(idx.map((id) => kv.get<PitchCompetition>(`pitchcomp:${id}`)));
  return (comps.filter(Boolean) as PitchCompetition[]).sort((a, b) => a.deadline - b.deadline);
}

// ── OKR Tracker ───────────────────────────────────────────────────────────────

export type OKREntry = {
  quarter: string;
  objective: string;
  keyResults: { text: string; progress: number }[];
  savedAt: number;
};

export async function saveOKR(email: string, entry: OKREntry): Promise<void> {
  await kv.set(`okr:${email.toLowerCase()}:${entry.quarter}`, entry, { ex: 365 * 24 * 3600 });
  const idx = (await kv.get<string[]>(`okr:idx:${email.toLowerCase()}`)) ?? [];
  if (!idx.includes(entry.quarter)) {
    await kv.set(`okr:idx:${email.toLowerCase()}`, [entry.quarter, ...idx].slice(0, 12));
  }
}

export async function getOKRs(email: string): Promise<OKREntry[]> {
  const idx = (await kv.get<string[]>(`okr:idx:${email.toLowerCase()}`)) ?? [];
  if (!idx.length) return [];
  const entries = await Promise.all(idx.map((q) => kv.get<OKREntry>(`okr:${email.toLowerCase()}:${q}`)));
  return entries.filter(Boolean) as OKREntry[];
}

// ── Achievements ──────────────────────────────────────────────────────────────

export type Achievement = {
  key: string;
  label: string;
  icon: string;
  awardedAt: number;
};

const ACHIEVEMENT_DEFS: Record<string, { label: string; icon: string }> = {
  first_eval:        { label: "First Reality Check",       icon: "🔍" },
  score_improved:    { label: "Score Improved",            icon: "📈" },
  score_70:          { label: "Scored 70+",                icon: "🌟" },
  score_80:          { label: "Scored 80+",                icon: "🏆" },
  three_tools:       { label: "3 Tools Completed",         icon: "🛠️" },
  community_post:    { label: "First Community Post",      icon: "💬" },
  journal_streak:    { label: "Weekly Journal Streak",     icon: "📝" },
  first_referral:    { label: "First Referral",            icon: "🤝" },
  referral_converted:{ label: "Referral Converted",        icon: "💰" },
  profile_complete:  { label: "Profile Complete",          icon: "✅" },
};

export async function getUserAchievements(email: string): Promise<Achievement[]> {
  return (await kv.get<Achievement[]>(`ach:${email.toLowerCase()}`)) ?? [];
}

export async function awardAchievement(email: string, key: string): Promise<boolean> {
  const def = ACHIEVEMENT_DEFS[key];
  if (!def) return false;
  const existing = await getUserAchievements(email);
  if (existing.some((a) => a.key === key)) return false;
  const updated = [...existing, { key, label: def.label, icon: def.icon, awardedAt: Date.now() }];
  await kv.set(`ach:${email.toLowerCase()}`, updated, { ex: PROFILE_TTL });
  return true;
}

export async function checkAndAwardAchievements(
  email: string,
  opts: { score?: number; toolsUsed?: string[]; action?: string }
): Promise<Achievement[]> {
  const awarded: Achievement[] = [];

  const tryAward = async (key: string) => {
    const ok = await awardAchievement(email, key);
    if (ok) {
      const def = ACHIEVEMENT_DEFS[key];
      if (def) awarded.push({ key, label: def.label, icon: def.icon, awardedAt: Date.now() });
    }
  };

  if (opts.action === "first_eval") await tryAward("first_eval");
  if (opts.action === "score_improved") await tryAward("score_improved");
  if (opts.action === "community_post") await tryAward("community_post");
  if (opts.action === "journal_streak") await tryAward("journal_streak");
  if (opts.action === "first_referral") await tryAward("first_referral");
  if (opts.action === "referral_converted") await tryAward("referral_converted");
  if (opts.action === "profile_complete") await tryAward("profile_complete");

  if (opts.score !== undefined) {
    if (opts.score >= 70) await tryAward("score_70");
    if (opts.score >= 80) await tryAward("score_80");
  }

  if (opts.toolsUsed && opts.toolsUsed.length >= 3) await tryAward("three_tools");

  return awarded;
}

// ── Email Drip ────────────────────────────────────────────────────────────────

export type EmailDripState = {
  email: string;
  name: string;
  firstEvalAt: number;
  sessionId: string;
  score: number;
  verdict: string;
  day1SentAt?: number;
  day3SentAt?: number;
  day7SentAt?: number;
};

const DRIP_TTL = 30 * 24 * 3600; // 30 days

export async function setEmailDrip(state: EmailDripState): Promise<void> {
  const key = state.email.toLowerCase();
  // Only set if no existing drip (don't reset on re-eval)
  const existing = await kv.get<EmailDripState>(`drip:${key}`);
  if (existing) return;
  await kv.set(`drip:${key}`, state, { ex: DRIP_TTL });
  const idx = (await kv.get<string[]>("drip:idx")) ?? [];
  if (!idx.includes(key)) await kv.set("drip:idx", [...idx, key].slice(0, 10000));
}

export async function updateEmailDrip(email: string, patch: Partial<EmailDripState>): Promise<void> {
  const key = email.toLowerCase();
  const existing = await kv.get<EmailDripState>(`drip:${key}`);
  if (!existing) return;
  await kv.set(`drip:${key}`, { ...existing, ...patch }, { ex: DRIP_TTL });
}

export async function getEmailDrip(email: string): Promise<EmailDripState | null> {
  return kv.get<EmailDripState>(`drip:${email.toLowerCase()}`);
}

export async function getAllEmailDrips(): Promise<EmailDripState[]> {
  const idx = (await kv.get<string[]>("drip:idx")) ?? [];
  if (!idx.length) return [];
  const items = await Promise.all(idx.map((e) => kv.get<EmailDripState>(`drip:${e}`)));
  return items.filter(Boolean) as EmailDripState[];
}
