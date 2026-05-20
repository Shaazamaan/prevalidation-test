"use client";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-base hover:border-[#E8A838]/60 transition shadow-lg"
      title={theme === "dark" ? "Day mode" : "Night mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
