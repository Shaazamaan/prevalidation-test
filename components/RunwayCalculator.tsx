"use client";

import { useState, useMemo } from "react";

function fmt(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

type Row = { month: number; label: string; openingBalance: number; revenue: number; burn: number; closingBalance: number };

export default function RunwayCalculator() {
  const [bankBalance, setBankBalance] = useState("");
  const [monthlyBurn, setMonthlyBurn] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [revenueGrowth, setRevenueGrowth] = useState("10");
  const [burnReduction, setBurnReduction] = useState("0");

  const bank = parseFloat(bankBalance) || 0;
  const burn = parseFloat(monthlyBurn) || 0;
  const rev = parseFloat(monthlyRevenue) || 0;
  const revGrowthPct = parseFloat(revenueGrowth) || 0;
  const burnReducPct = parseFloat(burnReduction) || 0;

  const rows = useMemo<Row[]>(() => {
    if (!bank || !burn) return [];
    const months: Row[] = [];
    let balance = bank;
    let currentRevenue = rev;
    let currentBurn = burn;
    const now = new Date();

    for (let i = 1; i <= 36; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const opening = balance;
      const netBurn = Math.max(0, currentBurn - currentRevenue);
      const closing = opening - netBurn;
      months.push({ month: i, label, openingBalance: opening, revenue: currentRevenue, burn: currentBurn, closingBalance: closing });
      balance = closing;
      currentRevenue = currentRevenue * (1 + revGrowthPct / 100);
      currentBurn = currentBurn * (1 - burnReducPct / 100);
      if (closing <= 0) break;
    }
    return months;
  }, [bank, burn, rev, revGrowthPct, burnReducPct]);

  const runwayMonths = rows.length;
  const lastRow = rows[rows.length - 1];
  const netBurnNow = Math.max(0, burn - rev);
  const breakEvenMonth = rows.find((r) => r.revenue >= r.burn);

  const runoutDate = (() => {
    if (!runwayMonths || !lastRow) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + runwayMonths);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  const runwayColor = runwayMonths >= 18 ? "text-green-400" : runwayMonths >= 9 ? "text-[#E8A838]" : "text-red-400";

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-14 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2">Runway Calculator</p>
          <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-2">How long can you run?</h1>
          <p className="text-[#555] text-sm">Enter your numbers. See your runway, break-even, and monthly projection.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: "Bank balance (₹)", value: bankBalance, setter: setBankBalance, placeholder: "e.g. 5000000 for ₹50L" },
            { label: "Monthly burn (₹)", value: monthlyBurn, setter: setMonthlyBurn, placeholder: "e.g. 300000 for ₹3L" },
            { label: "Monthly revenue (₹)", value: monthlyRevenue, setter: setMonthlyRevenue, placeholder: "0 if pre-revenue" },
            { label: "Revenue growth / month (%)", value: revenueGrowth, setter: setRevenueGrowth, placeholder: "e.g. 10" },
            { label: "Burn reduction / month (%)", value: burnReduction, setter: setBurnReduction, placeholder: "0 if flat" },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-xs text-[#555] block mb-1.5">{field.label}</label>
              <input
                type="number"
                min="0"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
              />
            </div>
          ))}
        </div>

        {rows.length > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Runway</p>
                <p className={`text-2xl font-bold ${runwayColor}`}>{runwayMonths}m</p>
                <p className="text-[10px] text-[#444] mt-0.5">{runoutDate ? `Until ${runoutDate}` : "36+ months"}</p>
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Net Burn/mo</p>
                <p className="text-2xl font-bold text-white">{fmt(netBurnNow)}</p>
                <p className="text-[10px] text-[#444] mt-0.5">burn minus revenue</p>
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Break-even</p>
                <p className="text-2xl font-bold text-white">{breakEvenMonth ? `M${breakEvenMonth.month}` : "—"}</p>
                <p className="text-[10px] text-[#444] mt-0.5">{breakEvenMonth ? breakEvenMonth.label : "Not reached"}</p>
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">End balance</p>
                <p className={`text-2xl font-bold ${(lastRow?.closingBalance ?? 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                  {lastRow ? fmt(Math.abs(lastRow.closingBalance)) : "—"}
                </p>
                <p className="text-[10px] text-[#444] mt-0.5">at month {runwayMonths}</p>
              </div>
            </div>

            {/* Danger zone warning */}
            {runwayMonths < 6 && (
              <div className="mb-4 px-4 py-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-sm">
                ⚠️ Less than 6 months of runway. Raise or cut burn immediately — most rounds take 3–6 months to close.
              </div>
            )}
            {runwayMonths >= 6 && runwayMonths < 12 && (
              <div className="mb-4 px-4 py-3 bg-yellow-950/30 border border-yellow-800/30 rounded-xl text-yellow-300 text-sm">
                ⏳ 6–12 months. Start fundraising conversations now — don&apos;t wait until it&apos;s urgent.
              </div>
            )}

            {/* Monthly table */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      {["Month", "Revenue", "Burn", "Net Burn", "Balance"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[#444] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const net = r.burn - r.revenue;
                      const isBreakEven = r.revenue >= r.burn;
                      return (
                        <tr key={r.month} className={`border-b border-[#0d0d0d] hover:bg-[#0d0d0d] transition ${isBreakEven ? "bg-green-950/20" : ""}`}>
                          <td className="px-4 py-2.5 text-[#666]">{r.label}</td>
                          <td className="px-4 py-2.5 text-green-400">{fmt(r.revenue)}</td>
                          <td className="px-4 py-2.5 text-red-400">{fmt(r.burn)}</td>
                          <td className={`px-4 py-2.5 ${net > 0 ? "text-red-400" : "text-green-400"}`}>{net > 0 ? `-${fmt(net)}` : `+${fmt(Math.abs(net))}`}</td>
                          <td className={`px-4 py-2.5 font-medium ${r.closingBalance > 0 ? "text-white" : "text-red-400"}`}>{fmt(r.closingBalance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!rows.length && bank === 0 && (
          <p className="text-[#333] text-sm text-center py-12">Enter your bank balance and monthly burn above to see your runway.</p>
        )}
      </div>
    </main>
  );
}
