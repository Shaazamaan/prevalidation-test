"use client";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center text-sm hover:border-[#E8A838]/30 transition-all duration-200"
      title={theme === "dark" ? "Day mode" : "Night mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
