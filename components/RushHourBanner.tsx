"use client";

import { useEffect, useState } from "react";

function isRushHour(): boolean {
  // IST = UTC+5:30. Rush hours: 9am-12pm and 6pm-10pm IST
  const now = new Date();
  const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  return (istHour >= 9 && istHour < 12) || (istHour >= 18 && istHour < 22);
}

export default function RushHourBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("dbk_rush_dismissed")) return;
    if (isRushHour()) setShow(true);
  }, []);

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("dbk_rush_dismissed", "1");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-amber-900/90 border-b border-[#E8A838]/30 px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-[#E8A838] text-xs flex-1 text-center">
        ⚡ <strong>Rush hour</strong> — response times may be slower. For faster results, try between <strong>12pm–6pm IST</strong>.
        {" "}<span className="hidden sm:inline text-amber-200/70">Save this to your home screen for quick access anytime.</span>
      </p>
      <button onClick={handleDismiss} className="text-[#E8A838]/60 hover:text-[#E8A838] text-lg leading-none shrink-0">×</button>
    </div>
  );
}
