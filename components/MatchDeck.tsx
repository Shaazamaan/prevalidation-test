"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchProfile } from "@/lib/db";

type Props = {
  profiles: MatchProfile[];
  myProfile: MatchProfile | null;
  isAuthenticated: boolean;
  userEmail: string | null;
  matchCount: number;
};

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage",
  mvp: "MVP",
  revenue: "Revenue",
  scale: "Scaling",
};

function gradientFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1},60%,35%), hsl(${h2},70%,25%))`;
}

function AvatarCard({ profile }: { profile: MatchProfile }) {
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
      style={{ background: gradientFromName(profile.startupName) }}
    >
      {profile.startupName[0]?.toUpperCase()}
    </div>
  );
}

export default function MatchDeck({ profiles, myProfile, isAuthenticated, userEmail, matchCount }: Props) {
  const [deck, setDeck] = useState(profiles);
  const [current, setCurrent] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [showGate, setShowGate] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({
    startupName: myProfile?.startupName ?? "",
    stage: myProfile?.stage ?? "idea",
    lookingFor: myProfile?.lookingFor?.join(", ") ?? "",
    skills: myProfile?.skills?.join(", ") ?? "",
    bio: myProfile?.bio ?? "",
    location: myProfile?.location ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const GUEST_LIMIT = 5;

  const handleSwipe = async (direction: "like" | "pass") => {
    if (!isAuthenticated && guestCount >= GUEST_LIMIT) {
      setShowGate(true);
      return;
    }
    const profile = deck[current];
    if (!profile) return;

    const body: Record<string, unknown> = { targetEmail: profile.email, direction };
    if (!isAuthenticated) body.guestCount = guestCount;

    const res = await fetch("/api/match/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { isMatch?: boolean; limitReached?: boolean; guestCount?: number };

    if (data.limitReached) { setShowGate(true); return; }
    if (!isAuthenticated && data.guestCount) setGuestCount(data.guestCount);
    if (data.isMatch) {
      setIsMatch(true);
      setTimeout(() => { setIsMatch(false); setCurrent((c) => c + 1); }, 1500);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    await fetch("/api/match/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startupName: profileData.startupName,
        stage: profileData.stage,
        lookingFor: profileData.lookingFor.split(",").map((s) => s.trim()).filter(Boolean),
        skills: profileData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        bio: profileData.bio,
        location: profileData.location,
        active: true,
      }),
    });
    setSavingProfile(false);
    setShowProfileForm(false);
  };

  const profile = deck[current];

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-16 pt-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <Link href="/" className="text-[#555] hover:text-white text-sm transition block mb-1">← Home</Link>
            <h1 className="text-white text-2xl font-semibold">Find Co-founders</h1>
          </div>
          <div className="flex items-center gap-3">
            {matchCount > 0 && (
              <Link href="/match/messages" className="text-xs px-3 py-1.5 bg-[#E8A838] text-black font-semibold rounded-lg">
                {matchCount} Match{matchCount !== 1 ? "es" : ""}
              </Link>
            )}
            {isAuthenticated && (
              <button
                onClick={() => setShowProfileForm(!showProfileForm)}
                className="text-xs px-3 py-1.5 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition"
              >
                {myProfile ? "Edit Profile" : "Create Profile"}
              </button>
            )}
          </div>
        </div>

        {/* Profile form */}
        {showProfileForm && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 mb-6 space-y-4">
            <h2 className="text-white font-semibold text-sm">Your Founder Profile</h2>
            <div className="space-y-3">
              {[
                { label: "Startup Name *", key: "startupName", placeholder: "e.g. PayEase" },
                { label: "Your Bio *", key: "bio", placeholder: "What you're building and why" },
                { label: "Looking For (comma-separated)", key: "lookingFor", placeholder: "co-founder, designer, advisor" },
                { label: "Your Skills (comma-separated)", key: "skills", placeholder: "sales, product, engineering" },
                { label: "Location", key: "location", placeholder: "Bengaluru, Remote" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[#555] text-xs mb-1.5 block">{f.label}</label>
                  <input
                    value={profileData[f.key as keyof typeof profileData]}
                    onChange={(e) => setProfileData({ ...profileData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-[#0d0d0d] border border-[#333] rounded-xl px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
                  />
                </div>
              ))}
              <div>
                <label className="text-[#555] text-xs mb-1.5 block">Stage</label>
                <select
                  value={profileData.stage}
                  onChange={(e) => setProfileData({ ...profileData, stage: e.target.value as "idea" | "mvp" | "revenue" | "scale" })}
                  className="w-full bg-[#0d0d0d] border border-[#333] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E8A838] transition"
                >
                  {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="w-full bg-[#E8A838] hover:bg-[#d4962e] text-black font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {savingProfile ? "Saving…" : "Save Profile"}
            </button>
          </div>
        )}

        {/* Guest sign-in gate */}
        {showGate && (
          <div className="bg-[#111] border border-[#E8A838]/30 rounded-2xl p-8 text-center mb-6">
            <p className="text-white font-semibold mb-2">Sign in to continue swiping</p>
            <p className="text-[#666] text-sm mb-6">You've seen {GUEST_LIMIT} profiles. Create a free account to keep going and see who liked you back.</p>
            <a
              href="/api/auth/signin/google?callbackUrl=/match"
              className="inline-flex items-center gap-2 bg-white text-[#111] font-semibold py-3 px-6 rounded-xl hover:bg-[#f0f0f0] transition text-sm"
            >
              Continue with Google
            </a>
          </div>
        )}

        {/* Match notification */}
        {isMatch && (
          <div className="bg-[#111] border border-[#E8A838]/40 rounded-2xl p-6 text-center mb-6 animate-pulse">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-[#E8A838] font-bold text-lg">It&apos;s a Match!</p>
            <p className="text-[#666] text-sm mt-1">You can now message each other</p>
          </div>
        )}

        {/* Card deck */}
        {!showGate && (
          <>
            {profile ? (
              <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
                {/* Gradient header */}
                <div className="h-24 flex items-end p-5" style={{ background: gradientFromName(profile.startupName) }}>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{profile.startupName}</p>
                    <p className="text-white/70 text-xs">{STAGE_LABELS[profile.stage] ?? profile.stage}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-white text-sm font-medium mb-1">{profile.displayName}</p>
                    {profile.location && <p className="text-[#555] text-xs">{profile.location}</p>}
                  </div>

                  <p className="text-[#888] text-sm leading-relaxed">{profile.bio}</p>

                  {profile.lookingFor.length > 0 && (
                    <div>
                      <p className="text-[#444] text-xs mb-2">Looking for</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.lookingFor.map((l) => (
                          <span key={l} className="text-xs px-2.5 py-1 bg-[#E8A838]/10 border border-[#E8A838]/20 text-[#E8A838] rounded-full">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.skills.length > 0 && (
                    <div>
                      <p className="text-[#444] text-xs mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s) => (
                          <span key={s} className="text-xs px-2.5 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Swipe buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => handleSwipe("pass")}
                      className="flex-1 py-3 border border-[#333] text-[#666] rounded-xl hover:border-red-800 hover:text-red-400 transition font-semibold text-sm"
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => handleSwipe("like")}
                      className="flex-1 py-3 bg-[#E8A838] hover:bg-[#d4962e] text-black rounded-xl font-semibold text-sm transition"
                    >
                      Connect
                    </button>
                  </div>

                  {!isAuthenticated && (
                    <p className="text-center text-[#444] text-xs">{GUEST_LIMIT - guestCount} free swipes left</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-[#444] text-sm mb-2">You&apos;ve seen everyone for now.</p>
                {!isAuthenticated ? (
                  <>
                    <p className="text-[#333] text-xs mb-6">Sign in to create your profile and see who liked you.</p>
                    <a
                      href="/api/auth/signin/google?callbackUrl=/match"
                      className="inline-flex items-center gap-2 bg-white text-[#111] font-semibold py-3 px-6 rounded-xl hover:bg-[#f0f0f0] transition text-sm"
                    >
                      Sign in with Google
                    </a>
                  </>
                ) : (
                  <p className="text-[#333] text-xs">Check your <Link href="/match/messages" className="text-[#E8A838] hover:underline">matches</Link> to start chatting.</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Bottom info */}
        <p className="text-center text-[#333] text-xs mt-6">
          {profiles.length} founders on Devbridge Match · <Link href="/insights" className="hover:text-[#555] transition">Read Insights</Link>
        </p>
      </div>
    </main>
  );
}
