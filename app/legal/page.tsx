"use client";

import { useState } from "react";
import type { Metadata } from "next";

// Note: metadata can't be exported from a client component.
// Move metadata to a separate layout or use a server component wrapper if needed.

type Tab = "india" | "global" | "fundraising";

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#1a1a1a] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#161616] transition"
      >
        <span className="text-white font-medium text-sm">{title}</span>
        <span className="text-[#444] text-sm flex-shrink-0 ml-4">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#1a1a1a] pt-4 text-[#888] text-sm leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

const FUNDRAISING_TERMS = [
  { term: "Valuation cap", def: "The maximum company valuation at which your SAFE or convertible note converts to equity. It protects early investors from being diluted if the company's valuation skyrockets before the next round." },
  { term: "Discount rate", def: "A percentage (typically 10-20%) by which early investors get to convert their notes into equity at a lower price than later investors. It rewards risk taken early." },
  { term: "Pro-rata rights", def: "The right of an existing investor to participate in future funding rounds to maintain their ownership percentage. Helps investors avoid dilution in later rounds." },
  { term: "Information rights", def: "The contractual right of an investor to receive periodic financial updates (monthly or quarterly). Usually granted to investors above a minimum check size." },
  { term: "Board seat", def: "A formal position on the company's board of directors. Larger investors often negotiate a board seat, giving them voting power on major company decisions." },
  { term: "Drag-along", def: "A right that allows majority shareholders to force minority shareholders to join in the sale of a company. Prevents a small investor from blocking an acquisition." },
  { term: "Tag-along", def: "The right of minority shareholders to join a sale if majority shareholders sell their stake. Protects smaller investors from being left behind in a liquidity event." },
  { term: "Liquidation preference", def: "Defines how proceeds are distributed in a sale or shutdown — investors get paid before founders and employees. A 1x non-participating preference is founder-friendly; 2x or participating is not." },
  { term: "Anti-dilution (broad-based weighted average)", def: "Protects investors from dilution in a down round by adjusting their conversion price based on a formula that accounts for all outstanding shares. More founder-friendly than ratchet." },
  { term: "Anti-dilution (ratchet)", def: "The harshest form: if you raise at a lower valuation, the investor's price resets to the new lower price as if they invested at that price originally. Avoid if possible." },
  { term: "Lead investor", def: "The investor who sets the terms, leads due diligence, and takes the largest check in a round. Other investors typically follow the lead's terms and valuation." },
  { term: "Bridge round", def: "A small financing round between major rounds, usually structured as a convertible note or SAFE. Used to extend runway while preparing for a larger raise." },
  { term: "Down round", def: "A funding round where the company's valuation is lower than the previous round. Triggers anti-dilution provisions and can damage morale and signaling." },
  { term: "Runway", def: "The number of months your startup can operate before running out of cash, at the current burn rate. Calculated as: Cash / Monthly Burn Rate." },
  { term: "Burn rate", def: "The rate at which a startup spends its cash reserves each month. Gross burn is total spend; net burn is spend minus revenue." },
  { term: "MRR / ARR", def: "Monthly Recurring Revenue and Annual Recurring Revenue — the predictable, subscription-based revenue your business generates. ARR = MRR × 12." },
  { term: "Churn", def: "The percentage of customers or revenue lost over a given period. High churn signals a product-market fit or satisfaction problem that will kill growth." },
  { term: "LTV (Lifetime Value)", def: "The total revenue a business expects to earn from a single customer over their entire relationship. Higher LTV justifies higher acquisition costs." },
  { term: "CAC (Customer Acquisition Cost)", def: "The total cost to acquire one new customer, including marketing, sales, and related overhead. A healthy business has LTV / CAC ratio of 3x or higher." },
  { term: "SAFE", def: "Simple Agreement for Future Equity — a financing instrument that converts into equity at the next priced round. No interest, no maturity date, simpler than a convertible note." },
  { term: "Convertible note", def: "A short-term debt instrument that converts into equity at a future financing round. Unlike a SAFE, it has an interest rate and a maturity date by which it must convert or be repaid." },
];

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("india");

  const tabs: { key: Tab; label: string }[] = [
    { key: "india", label: "India" },
    { key: "global", label: "Global" },
    { key: "fundraising", label: "Fundraising Terms" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Legal Guide</p>
        <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white mb-2">
          Startup Legal Essentials
        </h1>

        {/* Disclaimer */}
        <div className="bg-[#111] border border-[#E8A838]/20 rounded-xl px-4 py-3 mb-8">
          <p className="text-[#888] text-xs leading-relaxed">
            <span className="text-[#E8A838] font-medium">Educational content only — not legal advice.</span>{" "}
            Always consult a qualified lawyer for your specific situation. Laws and regulations change frequently.
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-2 flex-wrap mb-8">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`text-xs px-3 py-1.5 rounded-full transition font-medium ${
                activeTab === key
                  ? "bg-[#E8A838] text-black"
                  : "text-[#555] hover:text-white border border-[#1a1a1a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* India tab */}
        {activeTab === "india" && (
          <div className="space-y-3">
            <AccordionItem title="Angel Tax (Section 56(2)(viib))">
              <p><span className="text-white font-medium">What it is:</span> Under Section 56(2)(viib) of the Income Tax Act, if an unlisted company raises funds above its Fair Market Value (FMV) from an Indian resident investor, the excess amount is treated as income and taxed.</p>
              <p><span className="text-white font-medium">When it applies:</span> Triggered when shares are issued at a premium above FMV to any Indian resident investor (individual or company).</p>
              <p><span className="text-white font-medium">Who it affects:</span> Indian startups raising from Indian angel investors. Foreign investors are exempt.</p>
              <p><span className="text-white font-medium">How to avoid it:</span> Get DPIIT recognition (exempts you entirely), or get a valuation certificate from a registered valuer before the round to establish FMV.</p>
              <p className="text-[#E8A838]/80 text-xs">Seek a CA for specifics — valuations are fact-sensitive and can be challenged.</p>
            </AccordionItem>

            <AccordionItem title="DPIIT Recognition">
              <p><span className="text-white font-medium">What it is:</span> DPIIT (Department for Promotion of Industry and Internal Trade) recognition under the Startup India program grants legal benefits to qualifying startups.</p>
              <p><span className="text-white font-medium">Eligibility:</span> Incorporated less than 10 years ago, annual turnover under ₹100 crore, working towards innovation/improvement of products, processes, or services.</p>
              <p><span className="text-white font-medium">How to apply:</span> Via the Startup India portal (startupindia.gov.in). Free to apply, typically approved within 2 weeks.</p>
              <p><span className="text-white font-medium">Benefits:</span> Angel tax exemption, fast-track patent examination (80% fee reduction), self-certification compliance for 9 labour laws, income tax exemption for 3 consecutive years (under Section 80-IAC, requires DIPP notification).</p>
            </AccordionItem>

            <AccordionItem title="ESOP Basics for Indian Startups">
              <p><span className="text-white font-medium">What ESOPs are:</span> Employee Stock Option Plans give employees the right (but not obligation) to buy company shares at a predetermined price after a vesting period.</p>
              <p><span className="text-white font-medium">Vesting:</span> Typically 4-year vesting with a 1-year cliff (nothing vests in year 1, then monthly/quarterly thereafter). Standard in India for funded startups.</p>
              <p><span className="text-white font-medium">Taxation in India:</span> (1) At exercise — treated as perquisite, taxed as salary income at your marginal rate. (2) At sale — capital gains tax applies (LTCG if held 24+ months as unlisted, 12+ months after listing).</p>
              <p><span className="text-white font-medium">Setup:</span> ESOPs must be approved by shareholders via a special resolution. Most startups set up an ESOP pool of 10-15% of fully diluted equity before Series A.</p>
              <p className="text-[#E8A838]/80 text-xs">Tax on exercise (perquisite) can be a significant burden for employees of unlisted companies. Many startups negotiate deferred exercise or delay ESOP exercises near liquidity events.</p>
            </AccordionItem>

            <AccordionItem title="Flipping to Singapore or Delaware">
              <p><span className="text-white font-medium">Why founders flip:</span> Easier to raise USD funding, US/Singapore investors prefer familiar legal structures, cleaner cap table management, and better access to international banking.</p>
              <p><span className="text-white font-medium">How it works:</span> You incorporate a new holding company (Delaware Corp or Singapore Pte Ltd) and make it the parent of your Indian entity via a share swap or merger. Indian operations continue as a subsidiary.</p>
              <p><span className="text-white font-medium">RBI/FEMA compliance:</span> Mandatory. Indian founders must file LRS (Liberalised Remittance Scheme) and comply with FEMA regulations. The ODI (Overseas Direct Investment) route applies for the holding structure.</p>
              <p><span className="text-white font-medium">Costs and timeline:</span> Typically ₹2-5 lakh in legal and filing costs, 3-6 months to complete properly. Use a startup-focused law firm.</p>
            </AccordionItem>

            <AccordionItem title="GST for Startups">
              <p><span className="text-white font-medium">Registration threshold:</span> Mandatory if annual revenue exceeds ₹20 lakh (₹10 lakh for Northeast states), or if you do interstate business regardless of turnover.</p>
              <p><span className="text-white font-medium">SaaS / software rate:</span> B2B SaaS products attract 18% GST. Most software services fall under this category.</p>
              <p><span className="text-white font-medium">Filing frequency:</span> Quarterly GSTR-3B filing for businesses with turnover under ₹5 crore (QRMP scheme). Monthly otherwise.</p>
              <p><span className="text-white font-medium">Input Tax Credit (ITC):</span> You can claim ITC on GST paid for business expenses (office rent, software tools, etc.) to offset your GST liability.</p>
              <p><span className="text-white font-medium">Reverse Charge Mechanism (RCM):</span> When you buy services from foreign vendors (AWS, Anthropic, Stripe, etc.), you must self-assess and pay 18% GST under RCM — even though the foreign vendor doesn't charge GST. You can then claim ITC on this.</p>
            </AccordionItem>

            <AccordionItem title="Trademark Registration in India">
              <p><span className="text-white font-medium">Where to file:</span> IP India (ipindia.gov.in) — the official registry. Search existing marks before filing to avoid conflicts.</p>
              <p><span className="text-white font-medium">Class for SaaS/software:</span> Class 42 covers software, SaaS, technology services, and IT consulting. You may also need Class 35 for business services.</p>
              <p><span className="text-white font-medium">Cost:</span> ₹4,500 per class for startups and small entities (vs. ₹9,000 for others). File online for a faster process.</p>
              <p><span className="text-white font-medium">Timeline:</span> 18-24 months for full registration, but you can use the ™ symbol immediately after filing. The ® symbol is only usable after registration is granted.</p>
              <p><span className="text-white font-medium">Tip:</span> Search before you build your brand. Check ipindia.gov.in/publicsearch and also Google for common law usage.</p>
            </AccordionItem>
          </div>
        )}

        {/* Global tab */}
        {activeTab === "global" && (
          <div className="space-y-3">
            <AccordionItem title="Delaware C-Corporation">
              <p><span className="text-white font-medium">Why it&apos;s popular:</span> Delaware has the most developed corporate law in the US, with a specialized Court of Chancery. VCs and US investors strongly prefer Delaware C-Corps for investment compatibility.</p>
              <p><span className="text-white font-medium">How to incorporate:</span> Use Stripe Atlas ($500), Firstbase.io ($399), or a startup lawyer ($500-2,000). Takes 1-7 days. You get a US EIN, registered agent address, and operating agreement.</p>
              <p><span className="text-white font-medium">Annual maintenance:</span> Registered agent fee (~$100-150/year), Delaware franchise tax (minimum ~$400/year for small companies if using authorized shares method), and annual report filing.</p>
              <p><span className="text-white font-medium">Best for:</span> Raising from US VCs or angels, issuing stock options to US employees, planning for a US IPO.</p>
            </AccordionItem>

            <AccordionItem title="Singapore Private Limited (Pte Ltd)">
              <p><span className="text-white font-medium">Why Singapore:</span> Popular for Southeast Asia and India-based startups because of 0% capital gains tax, strong investor and legal infrastructure, and proximity to Asian markets.</p>
              <p><span className="text-white font-medium">Setup:</span> Requires at least one local director (nominee director services are widely available, ~$1,000-2,000/year). Minimum paid-up capital of SGD 1. Uses Corppass for government filings.</p>
              <p><span className="text-white font-medium">Corporate tax:</span> 17% headline rate, but significant startup exemptions apply (75% exemption on first SGD 100,000 of income for first 3 years).</p>
              <p><span className="text-white font-medium">For Indian founders:</span> Popular flip destination. Requires RBI/FEMA compliance if Indian operations are subsidiaries.</p>
            </AccordionItem>

            <AccordionItem title="SAFEs and Convertible Notes">
              <p><span className="text-white font-medium">SAFE (Simple Agreement for Future Equity):</span> Created by Y Combinator, a SAFE is not debt — it converts to equity at the next priced round. No interest rate, no maturity date. Terms include a valuation cap and/or discount rate. Simpler and faster than a convertible note. Standard for pre-seed rounds globally.</p>
              <p><span className="text-white font-medium">Convertible note:</span> A debt instrument with an interest rate (typically 5-8%) and maturity date (12-24 months). If no priced round happens by maturity, the note may need to be repaid or extended. More complex but gives investors the security of debt.</p>
              <p><span className="text-white font-medium">Which to use:</span> SAFEs for pre-seed/seed in most geographies. Convertible notes if investors require debt security or if local law doesn&apos;t recognize SAFEs well.</p>
            </AccordionItem>

            <AccordionItem title="SEIS / EIS (UK)">
              <p><span className="text-white font-medium">What it is:</span> UK government schemes that provide tax relief to investors in qualifying UK-registered startups. SEIS is for very early stage; EIS is for slightly later stage.</p>
              <p><span className="text-white font-medium">Tax relief:</span> SEIS: 50% income tax relief for investors (up to £200,000 invested). EIS: 30% income tax relief (up to £1 million). Both also offer capital gains exemption on profits if held 3+ years.</p>
              <p><span className="text-white font-medium">Why it matters:</span> Dramatically reduces investor risk, making it easier to raise from UK angels who might otherwise hesitate. Common in the London startup ecosystem.</p>
              <p><span className="text-white font-medium">Process:</span> Apply to HMRC for Advance Assurance before raising to confirm eligibility. Your company must meet specific conditions (age, trading activity, industry).</p>
            </AccordionItem>

            <AccordionItem title="Cap Table Basics">
              <p><span className="text-white font-medium">What it is:</span> A capitalization table lists all shareholders and their ownership percentages, types of equity, and dilution through funding rounds.</p>
              <p><span className="text-white font-medium">Key components:</span> Founders&apos; equity (typically 70-90% at founding), ESOP pool (10-20% for early rounds), investor equity from each funding round, and any outstanding SAFEs/convertibles.</p>
              <p><span className="text-white font-medium">Dilution math:</span> Each funding round dilutes all existing shareholders proportionally. A 20% raise means everyone&apos;s ownership drops by 20% of what they had before.</p>
              <p><span className="text-white font-medium">Pro-rata rights:</span> Allow existing investors to invest in future rounds to maintain their ownership percentage. Important to negotiate early — some investors expect it, others ask for it.</p>
              <p><span className="text-white font-medium">Tools:</span> Carta (US), Ledgy (Europe), or a simple spreadsheet for early stage. Keep it clean from day 1 — messy cap tables kill deals.</p>
            </AccordionItem>
          </div>
        )}

        {/* Fundraising terms tab */}
        {activeTab === "fundraising" && (
          <div className="space-y-3">
            <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-2">
              <p className="text-[#555] text-xs">20 key terms every founder should know before talking to investors.</p>
            </div>
            {FUNDRAISING_TERMS.map(({ term, def }) => (
              <div key={term} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
                <p className="text-white font-semibold text-sm mb-2">{term}</p>
                <p className="text-[#888] text-sm leading-relaxed">{def}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
