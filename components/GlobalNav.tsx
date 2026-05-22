"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tools", label: "Tools" },
  { href: "/feed", label: "Feed" },
  { href: "/match", label: "Match" },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 sm:px-6
                 bg-[#0a0a0a]/90 border-b border-white/[0.04]"
      style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mr-6 shrink-0 group">
        <span
          className="w-4 h-4 rounded-full bg-[#E8A838] shrink-0 transition-all duration-200"
          style={{ boxShadow: "0 0 0 3px rgba(232,168,56,0.15)" }}
        />
        <span className="text-white text-sm font-semibold hidden sm:block tracking-wide">
          Devbridge
        </span>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden sm:flex items-center gap-0.5">
        {NAV_LINKS.map(({ href, label }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                active
                  ? "text-white bg-[#1a1a1a]"
                  : "text-[#555] hover:text-[#aaa] hover:bg-[#111]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-1 ml-auto">
        <Link
          href="/insights"
          className="hidden sm:block text-xs text-[#383838] hover:text-[#666] transition-colors duration-150 px-2.5 py-1.5 rounded-lg hover:bg-[#111]"
        >
          Insights
        </Link>
        <Link
          href="/agent/register"
          className="hidden sm:block text-xs text-[#383838] hover:text-[#666] transition-colors duration-150 px-2.5 py-1.5 rounded-lg hover:bg-[#111]"
        >
          Agent
        </Link>
        <div className="w-px h-4 bg-[#1a1a1a] mx-1 hidden sm:block" />
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-8 h-8 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center
                     text-sm hover:border-[#E8A838]/30 transition-all duration-200"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
