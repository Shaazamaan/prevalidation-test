import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Devbridge — Startup Readiness & Pitch Analysis",
  description: "AI-powered startup evaluation tools. Founder Readiness Check, Startup Viability Advisor, and Pitch Deck Validator. Know where you stand before you build.",
  openGraph: {
    title: "Devbridge — Startup Readiness & Pitch Analysis",
    description: "Find out if your startup idea is ready for market validation — before you waste a single day.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Devbridge",
    description: "AI-powered startup readiness and pitch deck evaluation.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-white font-sans antialiased">{children}</body>
    </html>
  );
}
