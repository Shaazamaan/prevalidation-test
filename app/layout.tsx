import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalNav from "@/components/GlobalNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import RushHourBanner from "@/components/RushHourBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import MobileNav from "@/components/MobileNav";
import FeedbackButton from "@/components/FeedbackButton";
import SessionWrapper from "@/components/SessionWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#E8A838",
};

export const metadata: Metadata = {
  title: "Devbridge — Startup Readiness & Pitch Analysis",
  description: "AI-powered startup evaluation tools for founders. Readiness Check, Viability Advisor, Pitch Deck Validator, and 10+ AI tools. Know if your startup is fundable before you build.",
  keywords: ["startup evaluation", "pitch deck validator", "founder readiness", "startup viability", "seed funding", "startup advisor", "Devbridge", "startup tools", "AI tools for founders"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Devbridge",
  },
  openGraph: {
    title: "Devbridge — Startup Readiness & Pitch Analysis",
    description: "Find out if your startup idea is ready for market validation — before you waste a single day.",
    type: "website",
    siteName: "Devbridge",
  },
  twitter: {
    card: "summary",
    title: "Devbridge",
    description: "AI-powered startup readiness and pitch deck evaluation for founders.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#0a0a0a] text-white font-sans antialiased">
        <SessionWrapper>
          <ThemeProvider>
            <AnnouncementBanner />
            <RushHourBanner />
            <GlobalNav />
            <div className="pt-12">
              {children}
            </div>
            <MobileNav />
            <FeedbackButton />
            <PWAInstallPrompt />
            <Analytics />
          </ThemeProvider>
        </SessionWrapper>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
