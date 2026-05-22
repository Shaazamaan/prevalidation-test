"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("dbk_pwa_dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setInstalled(true); setVisible(false); });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || installed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      await trackInstallAndSubscribe();
    }
    setVisible(false);
  };

  const trackInstallAndSubscribe = async () => {
    try {
      let subscription: PushSubscriptionJSON | null = null;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey && "serviceWorker" in navigator && "PushManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
          });
          subscription = sub.toJSON();
        }
      }
      await fetch("/api/pwa/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      }).catch(() => {});
    } catch {
      fetch("/api/pwa/install", { method: "POST" }).catch(() => {});
    }
  };

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)));
  }

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("dbk_pwa_dismissed", "1");
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 bg-[#111] border border-[#E8A838]/40 rounded-xl p-4 shadow-2xl transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold mb-1">Add to Home Screen</p>
          <p className="text-[#888] text-xs">Get quick access to Devbridge tools + future updates pushed to you.</p>
        </div>
        <button onClick={handleDismiss} className="text-[#444] hover:text-[#888] text-lg leading-none mt-0.5">×</button>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={handleInstall} className="flex-1 bg-[#E8A838] text-black text-xs font-semibold py-2 rounded-lg hover:bg-[#d4962e] transition">
          Add to Home Screen
        </button>
        <button onClick={handleDismiss} className="flex-1 border border-[#333] text-[#666] text-xs py-2 rounded-lg hover:border-[#555] transition">
          Not now
        </button>
      </div>
    </div>
  );
}
