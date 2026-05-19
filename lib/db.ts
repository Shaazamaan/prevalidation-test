import { kv } from "@vercel/kv";

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type Session = {
  id: string;
  founderName: string;
  startupIdea: string;
  messages: Message[];
  status: "active" | "completed";
  createdAt: number;
  ipHash: string;
};

export type Report = {
  verdict: "READY" | "CONDITIONALLY READY" | "NOT READY";
  verdictExplanation: string;
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
  killSignals: string[];
  finalSummary: string;
};

export async function createSession(session: Session): Promise<void> {
  await kv.set(`session:${session.id}`, session);
}

export async function getSession(id: string): Promise<Session | null> {
  return kv.get<Session>(`session:${id}`);
}

export async function updateSession(id: string, data: Partial<Session>): Promise<void> {
  const session = await getSession(id);
  if (!session) throw new Error("Session not found");
  await kv.set(`session:${id}`, { ...session, ...data });
}

export async function saveReport(sessionId: string, report: Report): Promise<void> {
  await kv.set(`report:${sessionId}`, report);
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

export async function deleteSession(id: string): Promise<void> {
  await kv.del(`session:${id}`);
  await kv.del(`report:${id}`);
}

export async function getRateLimitCount(ipHash: string): Promise<number> {
  const count = await kv.get<number>(`ratelimit:${ipHash}`);
  return count ?? 0;
}

export async function incrementRateLimit(ipHash: string): Promise<void> {
  const key = `ratelimit:${ipHash}`;
  const exists = await kv.get(key);
  if (exists === null) {
    await kv.set(key, 1, { ex: 3600 });
  } else {
    await kv.incr(key);
  }
}

export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "salt_prevalidation");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
