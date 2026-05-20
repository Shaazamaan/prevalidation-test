import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Founder Readiness Check — Are You Ready to Validate?",
  description: "Answer 70 structured questions across 14 dimensions. Get a brutally honest AI evaluation of whether your startup idea is ready for market validation.",
  openGraph: {
    title: "Founder Readiness Check",
    description: "Find out if your startup idea is ready for market validation — before you waste a single day.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Founder Readiness Check",
    description: "Get a brutally honest evaluation of your startup readiness.",
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
