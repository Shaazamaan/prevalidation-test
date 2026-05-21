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
  prefill?: { name?: string; email?: string; contact?: string };
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
  couponToken?: string;
  discountCoupon?: string; // referral coupon code applied
  amount: number; // paise
}

interface Props {
  description?: string;
  founderName?: string;
  founderEmail?: string;
  founderPhone?: string;
  onSuccess: (payment: PaymentResult) => void;
  onCancel: () => void;
  receipt: string;
  tool?: "readiness" | "advisor" | "pitchdeck";
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

const DISCLAIMER = "This is an AI-generated evaluation provided for informational purposes only. It does not constitute financial, legal, investment, or business advice. Results may vary based on the information provided. Devbridge and its AI systems may make errors. This report should not be the sole basis for any business decision.";

export default function PaymentModal({
  description = "AI Evaluation Report",
  founderName,
  founderEmail,
  founderPhone,
  onSuccess,
  onCancel,
  receipt,
  tool = "readiness",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [rzpKeyId, setRzpKeyId] = useState(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "");
  const [baseAmount, setBaseAmount] = useState(99900);

  const [coupon, setCoupon] = useState("");
  const [couponStatus, setCouponStatus] = useState<null | "valid" | "invalid" | "checking">(null);
  const [discount, setDiscount] = useState(0);
  const [free, setFree] = useState(false);
  const [couponToken, setCouponToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadRazorpayScript();
    fetch("/api/payment/config")
      .then((r) => r.json())
      .then((d: { keyId?: string }) => { if (d.keyId) setRzpKeyId(d.keyId); })
      .catch(() => {});
    fetch(`/api/payment/price?tool=${tool}`)
      .then((r) => r.json())
      .then((d: { amountPaise?: number }) => { if (d.amountPaise) setBaseAmount(d.amountPaise); })
      .catch(() => {});
  }, [tool]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponStatus("checking");
    try {
      const emailParam = founderEmail ? `&email=${encodeURIComponent(founderEmail)}` : "";
      const res = await fetch(`/api/payment/validate-coupon?code=${encodeURIComponent(coupon.trim())}${emailParam}`);
      const data = await res.json() as { valid: boolean; discount?: number; free?: boolean; couponToken?: string };
      if (data.valid) {
        setCouponStatus("valid");
        setDiscount(data.discount ?? 0);
        setFree(data.free ?? false);
        setCouponToken(data.couponToken);
      } else {
        setCouponStatus("invalid");
        setDiscount(0);
        setFree(false);
        setCouponToken(undefined);
      }
    } catch {
      setCouponStatus("invalid");
    }
  };

  const discountedAmount = discount > 0 ? Math.round(baseAmount * (1 - discount / 100)) : baseAmount;
  const baseDisplay = `₹${(baseAmount / 100).toLocaleString("en-IN")}`;
  const displayPrice = discount > 0 ? `₹${(discountedAmount / 100).toLocaleString("en-IN")}` : baseDisplay;

  const handlePay = async () => {
    if (!agreed) return;
    setLoading(true);
    setError("");

    if (free) {
      onSuccess({
        orderId: `FREE_${coupon.trim().toUpperCase()}`,
        paymentId: "FREE",
        signature: couponToken ?? "",
        couponToken,
        amount: 0,
      });
      return;
    }

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
        body: JSON.stringify({ receipt, discount: discount > 0 ? discount : undefined, tool }),
      });

      if (!orderRes.ok) {
        const d = await orderRes.json() as { error?: string };
        setError(d.error ?? "Failed to create payment order.");
        setLoading(false);
        return;
      }

      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };

      const rzp = new window.Razorpay({
        key: rzpKeyId,
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
            couponToken,
            discountCoupon: discount > 0 && !free ? coupon.trim().toUpperCase() : undefined,
            amount,
          });
        },
        prefill: {
          name: founderName ?? "",
          email: founderEmail ?? "",
          contact: founderPhone ?? "",
        },
        theme: { color: "#E8A838" },
        modal: {
          ondismiss: () => {
            setLoading(false);
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
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 px-4 overflow-y-auto py-6">
      <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full my-auto">
        <h2 className="font-crimson text-2xl text-white mb-1">Generate Your Report</h2>
        <p className="text-[#666] text-sm mb-5">One-time payment · AI evaluation delivered instantly.</p>

        <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[#888] text-sm">{description}</span>
            <div className="text-right">
              {discount > 0 && (
                <span className="text-[#555] text-sm line-through mr-2">{baseDisplay}</span>
              )}
              <span className="text-[#E8A838] font-bold text-xl">{displayPrice}</span>
            </div>
          </div>
          {couponStatus === "valid" && (
            <p className="text-green-400 text-xs mt-1">
              {free ? "100% off — Free!" : `${discount}% off applied`}
            </p>
          )}
          <p className="text-xs text-[#444] mt-1">Includes full report, scores, and next steps.</p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={coupon}
            onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponStatus(null); setDiscount(0); setFree(false); setCouponToken(undefined); }}
            placeholder="Coupon code"
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
          />
          <button
            onClick={applyCoupon}
            disabled={!coupon.trim() || couponStatus === "checking"}
            className="px-4 py-2 text-sm bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] rounded-lg hover:border-[#E8A838] hover:text-white transition disabled:opacity-50"
          >
            {couponStatus === "checking" ? "…" : "Apply"}
          </button>
        </div>
        {couponStatus === "invalid" && (
          <p className="text-red-400 text-xs mb-3">Invalid or expired code.</p>
        )}

        <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-[#666] uppercase tracking-wide mb-2 font-medium">Important Disclaimer</p>
          <p className="text-xs text-[#777] leading-relaxed">{DISCLAIMER}</p>
        </div>

        <label className="flex items-start gap-3 mb-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="accent-[#E8A838] mt-0.5 w-4 h-4 shrink-0"
          />
          <span className={`text-xs leading-relaxed transition ${agreed ? "text-[#aaa]" : "text-[#555] group-hover:text-[#666]"}`}>
            I understand this is an AI-generated advisory report and not professional advice. I agree to the{" "}
            <a href="/terms" target="_blank" className="underline hover:text-[#E8A838]">Terms of Service</a>{" "}
            and{" "}
            <a href="/refund-policy" target="_blank" className="underline hover:text-[#E8A838]">Refund Policy</a>.
          </span>
        </label>

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 mb-4">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-[#1a1a1a] border border-[#333] text-[#666] py-3 rounded-xl text-sm hover:text-white hover:border-[#444] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={loading || !agreed}
            className="flex-1 bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Opening…" : free ? "Get Report Free →" : `Pay ${displayPrice}`}
          </button>
        </div>

        <p className="text-center text-xs text-[#333] mt-4">
          {free ? "No payment required · Free access code applied" : "Secured by Razorpay · UPI · Cards · Net Banking"}
        </p>
      </div>
    </div>
  );
}
