import { kv } from "@vercel/kv";

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
  const keys = await kv.keys("session:*");
  if (!keys.length) return [];
  const sessions = await Promise.all(keys.map((k) => kv.get<Session>(k)));
  return (sessions.filter(Boolean) as Session[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSessionCount(): Promise<number> {
  const keys = await kv.keys("session:*");
  return keys.length;
}

export async function deleteSession(id: string): Promise<void> {
  await kv.del(`session:${id}`);
  await kv.del(`report:${id}`);
}

// ── Advisor sessions ──────────────────────────────────────────────────────────

export async function saveAdvisorSession(session: AdvisorSession): Promise<void> {
  await kv.set(`advisor:${session.id}`, session, { ex: SESSION_TTL });
}

export async function getAdvisorSession(id: string): Promise<AdvisorSession | null> {
  return kv.get<AdvisorSession>(`advisor:${id}`);
}

export async function getAllAdvisorSessions(): Promise<AdvisorSession[]> {
  const keys = await kv.keys("advisor:*");
  if (!keys.length) return [];
  const sessions = await Promise.all(keys.map((k) => kv.get<AdvisorSession>(k)));
  return (sessions.filter(Boolean) as AdvisorSession[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteAdvisorSession(id: string): Promise<void> {
  await kv.del(`advisor:${id}`);
}

export async function updateAdvisorNotes(id: string, adminNotes: string): Promise<void> {
  const session = await getAdvisorSession(id);
  if (!session) throw new Error("Advisor session not found");
  await kv.set(`advisor:${id}`, { ...session, adminNotes }, { ex: SESSION_TTL });
}

// ── Pitch-deck sessions ───────────────────────────────────────────────────────

export async function savePitchDeckSession(session: PitchDeckSession): Promise<void> {
  await kv.set(`pitchdeck:${session.id}`, session, { ex: SESSION_TTL });
}

export async function getPitchDeckSession(id: string): Promise<PitchDeckSession | null> {
  return kv.get<PitchDeckSession>(`pitchdeck:${id}`);
}

export async function getAllPitchDeckSessions(): Promise<PitchDeckSession[]> {
  const keys = await kv.keys("pitchdeck:*");
  if (!keys.length) return [];
  const sessions = await Promise.all(keys.map((k) => kv.get<PitchDeckSession>(k)));
  return (sessions.filter(Boolean) as PitchDeckSession[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePitchDeckSession(id: string): Promise<void> {
  await kv.del(`pitchdeck:${id}`);
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

export type ToolKey = "readiness" | "advisor" | "pitchdeck";
const DEFAULT_PRICE = 99900; // paise

export async function getToolPrice(tool: ToolKey): Promise<number> {
  const stored = await kv.get<number>(`pricing:${tool}`);
  return stored ?? DEFAULT_PRICE;
}

export async function setToolPrice(tool: ToolKey, amountPaise: number): Promise<void> {
  await kv.set(`pricing:${tool}`, amountPaise);
}

export async function getAllToolPrices(): Promise<Record<ToolKey, number>> {
  const [r, a, p] = await Promise.all([
    kv.get<number>("pricing:readiness"),
    kv.get<number>("pricing:advisor"),
    kv.get<number>("pricing:pitchdeck"),
  ]);
  return {
    readiness: r ?? DEFAULT_PRICE,
    advisor: a ?? DEFAULT_PRICE,
    pitchdeck: p ?? DEFAULT_PRICE,
  };
}

// ── Site control ────────────────────────────────────────────────────────────

export async function isSitePaused(): Promise<boolean> {
  return (await kv.get("site:paused")) === true;
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
  const key = `coupon:${code.toUpperCase()}`;
  const current = await kv.get<{ count: number; emails: string[] }>(key) ?? { count: 0, emails: [] };
  await kv.set(key, { count: current.count + 1, emails: [...current.emails, email].slice(-100) });
}

export async function getCouponUsage(code: string): Promise<{ count: number; emails: string[] }> {
  return (await kv.get<{ count: number; emails: string[] }>(`coupon:${code.toUpperCase()}`)) ?? { count: 0, emails: [] };
}

export async function getAllCouponStats(): Promise<{ code: string; count: number; emails: string[] }[]> {
  const keys = await kv.keys("coupon:*");
  if (!keys.length) return [];
  const results = await Promise.all(
    keys.map(async (k) => {
      const code = k.replace("coupon:", "");
      const data = await kv.get<{ count: number; emails: string[] }>(k) ?? { count: 0, emails: [] };
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
  const key = `pwa:sub:${Buffer.from(sub.endpoint).toString("base64").slice(0, 40)}`;
  await kv.set(key, sub, { ex: 365 * 24 * 60 * 60 });
  await kv.incr("pwa:install:count");
}

export async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  const keys = await kv.keys("pwa:sub:*");
  if (!keys.length) return [];
  const subs = await Promise.all(keys.map((k) => kv.get<PushSubscription>(k)));
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
  return "REF5-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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
    discount: 5,
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
