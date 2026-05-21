"use client";
import { useEffect, useState } from "react";

type Announcement = { message: string; type: "info" | "warning" | "success"; active: boolean };

const TYPE_STYLES = {
  info: "bg-blue-900/30 border-blue-800/40 text-blue-300",
  warning: "bg-yellow-900/30 border-yellow-800/40 text-yellow-300",
  success: "bg-green-900/30 border-green-800/40 text-green-300",
};

export default function AnnouncementBanner() {
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = "dbk_ann_dismissed";
    fetch("/api/admin/announcement")
      .then((r) => r.json())
      .then((d: Announcement | null) => {
        if (!d?.active) return;
        const lastDismissed = sessionStorage.getItem(key);
        if (lastDismissed === d.message) return;
        setAnn(d);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    if (ann) sessionStorage.setItem("dbk_ann_dismissed", ann.message);
    setDismissed(true);
  };

  if (!ann || dismissed) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 px-4 py-2.5 border-b text-xs ${TYPE_STYLES[ann.type]}`}>
      <span className="flex-1 text-center">{ann.message}</span>
      <button onClick={dismiss} className="shrink-0 opacity-60 hover:opacity-100 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
