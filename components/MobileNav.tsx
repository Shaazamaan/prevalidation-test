"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/dashboard", label: "Dashboard", icon: "◎" },
  { href: "/feed", label: "Feed", icon: "◈" },
  { href: "/match", label: "Match", icon: "♡" },
  { href: "/crm", label: "CRM", icon: "◇" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#0d0d0d] border-t border-[#1a1a1a]">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${
              pathname === item.href ? "text-[#E8A838]" : "text-[#444] hover:text-[#888]"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[9px]">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
