import { redirect } from "next/navigation";
import { auth } from "@/auth";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "shaazamaanshaji@gmail.com").toLowerCase();

export default async function AdminLoginPage() {
  const session = await auth();

  // Already signed in as admin — go straight to dashboard
  if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL) {
    redirect("/admin/dashboard");
  }

  const signInUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent("/admin/dashboard")}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#111] border border-[#222] rounded-xl p-8 text-center">
        <h1 className="font-crimson text-2xl font-semibold mb-2 text-white">Admin Access</h1>
        <p className="text-[#555] text-sm mb-8">Sign in with the authorised Google account to continue.</p>
        <a
          href={signInUrl}
          className="flex items-center justify-center gap-3 w-full bg-white text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-100 transition"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </a>
        {session?.user?.email && session.user.email.toLowerCase() !== ADMIN_EMAIL && (
          <p className="text-red-400 text-xs mt-4">
            Signed in as {session.user.email} — not authorised. Please sign in with the admin account.
          </p>
        )}
      </div>
    </main>
  );
}
