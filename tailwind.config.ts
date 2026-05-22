import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          accent: "#E8A838",
        },
        surface: {
          0: "#0a0a0a",
          1: "#111111",
          2: "#161616",
          3: "#1a1a1a",
        },
        border: {
          subtle: "rgba(255,255,255,0.04)",
          default: "#222222",
          strong: "#2a2a2a",
        },
      },
      fontFamily: {
        crimson: ["Crimson Pro", "Georgia", "serif"],
        inter: ["Inter", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        amber: "0 0 0 3px rgba(232,168,56,0.15)",
        "amber-lg": "0 0 24px rgba(232,168,56,0.12)",
        "inner-sm": "inset 0 1px 3px rgba(0,0,0,0.3)",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,168,56,0)" },
          "50%":       { boxShadow: "0 0 0 6px rgba(232,168,56,0.08)" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in-up":   "fadeInUp 0.4s ease both",
        "fade-in":      "fadeIn 0.3s ease both",
        shimmer:        "shimmer 1.8s infinite",
        "glow-pulse":   "glowPulse 2.5s ease-in-out infinite",
        "slide-in-right": "slideInRight 0.3s ease both",
      },
      transitionDuration: {
        "150": "150ms",
        "250": "250ms",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
