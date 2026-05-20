"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  orderId: string;
  paymentId: string;
  signature: string;
}

interface Props {
  description?: string;
  founderName?: string;
  onSuccess: (payment: PaymentResult) => void;
  onCancel: () => void;
  receipt: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "razorpay-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function PaymentModal({ description = "AI Evaluation Report", founderName, onSuccess, onCancel, receipt }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError("Payment SDK failed to load. Check your internet connection.");
        setLoading(false);
        return;
      }

      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt }),
      });

      if (!orderRes.ok) {
        const d = await orderRes.json();
        setError(d.error ?? "Failed to create payment order.");
        setLoading(false);
        return;
      }

      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount,
        currency: "INR",
        name: "Devbridge",
        description,
        order_id: orderId,
        handler: (response) => {
          onSuccess({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        prefill: { name: founderName ?? "" },
        theme: { color: "#E8A838" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onCancel();
          },
        },
      });

      rzp.open();
    } catch (e) {
      setError(`Payment error: ${String(e)}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] border border-[#333] rounded-2xl p-7 max-w-sm w-full">
        <h2 className="font-crimson text-2xl text-white mb-1">Generate Your Report</h2>
        <p className="text-[#888] text-sm mb-5">
          One-time payment required to generate your AI evaluation.
        </p>

        <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#666] text-sm">{description}</span>
            <span className="text-[#E8A838] font-semibold text-lg">₹999</span>
          </div>
          <p className="text-xs text-[#444]">Includes full report, scores, and actionable next steps.</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-[#222] text-white py-3 rounded-xl text-sm hover:bg-[#333] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="flex-1 bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-60"
          >
            {loading ? "Opening…" : "Pay ₹999"}
          </button>
        </div>

        <p className="text-center text-xs text-[#444] mt-4">
          Secured by Razorpay · UPI, Cards, Net Banking accepted
        </p>
        <p className="text-center text-xs text-[#333] mt-1">
          By paying you agree to our{" "}
          <a href="/terms" className="underline hover:text-[#555]">Terms</a> &amp;{" "}
          <a href="/refund-policy" className="underline hover:text-[#555]">Refund Policy</a>
        </p>
      </div>
    </div>
  );
}
