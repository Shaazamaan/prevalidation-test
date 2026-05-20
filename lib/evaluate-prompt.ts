import "server-only";

const PHASE_TITLES: Record<number, string> = {
  1: "The Problem",
  2: "The Solution Logic",
  3: "The Customer",
  4: "Market Reality",
  5: "Competition & Differentiation",
  6: "Business Model",
  7: "Traction & Evidence",
  8: "Founder-Market Fit",
  9: "Execution Plan",
  10: "Risk Awareness",
  11: "Launch Reality & Failure Planning",
  12: "Financial Reality Check",
  13: "Industry-Specific Risk",
  14: "Team, Legal & Knowledge Gaps",
};

function groupAnswersByPhase(
  answers: { question: string; answer: string; phase?: number }[]
): string {
  const grouped: Record<number, { question: string; answer: string }[]> = {};
  answers.forEach((a, i) => {
    const phase = a.phase ?? Math.ceil((i + 1) / 5);
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push({ question: a.question, answer: a.answer });
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([phase, qs]) => {
      const title = PHASE_TITLES[Number(phase)] ?? `Phase ${phase}`;
      const qaBlock = qs
        .map((q, i) => `  Q${i + 1}: ${q.question}\n  A: ${q.answer.trim() || "[No answer given]"}`)
        .join("\n\n");
      return `### PHASE ${phase} — ${title.toUpperCase()}\n${qaBlock}`;
    })
    .join("\n\n");
}

function getIndustryGuidance(startupType: string): string {
  const type = (startupType || "").toLowerCase();

  if (type.includes("saas") || type.includes("software") || type.includes("tech")) {
    return `INDUSTRY CONTEXT — SaaS / Software / Tech:
- Penalise if the founder has not identified integration costs, hosting costs, or cost-per-user at scale.
- Flag if there is no mention of churn, LTV, or CAC.
- Question assumptions about developer availability and engineering timelines.
- Probe whether the founder is building for themselves vs. for a validated customer segment.
- Watch for "build it and they will come" thinking — absence of a distribution plan is a red flag.
- Check if recurring revenue model assumptions are realistic for the market segment.`;
  }

  if (type.includes("ecommerce") || type.includes("product") || type.includes("physical")) {
    return `INDUSTRY CONTEXT — Physical Product / E-commerce:
- Flag dead stock, minimum order quantities, and unsold inventory risk.
- Penalise if cash flow timing (pay supplier before revenue arrives) is not addressed.
- Question return rates and unit economics at scale.
- Probe trend dependency — is demand stable or cyclical?
- Flag if expiry / shelf life / storage costs are not accounted for.
- Check whether supply chain concentration risk (single supplier) is acknowledged.
- Probe logistics and last-mile costs especially for fragile or temperature-sensitive goods.`;
  }

  if (type.includes("marketplace") || type.includes("platform")) {
    return `INDUSTRY CONTEXT — Marketplace / Platform:
- Flag the cold-start problem — how do you attract the first side of the market without the other?
- Penalise if network effects are assumed without a concrete seeding strategy.
- Question take rate assumptions and whether they are competitive.
- Probe trust and safety mechanisms — marketplaces live or die on trust.
- Flag liquidity risk — if supply and demand don't balance, the marketplace fails.
- Check whether the founder can explain who they acquire first (supply or demand) and why.`;
  }

  if (type.includes("service") || type.includes("agency") || type.includes("consulting")) {
    return `INDUSTRY CONTEXT — Service / Agency / Consulting:
- Flag time-for-money ceiling — services don't scale without hiring, which compresses margins.
- Penalise if there is no plan to productise or create repeatable delivery processes.
- Question dependency on the founder as the primary deliverer.
- Probe whether pricing is based on value or cost-plus.
- Flag high sensitivity to a small number of clients — one cancellation can be fatal.
- Check whether IP, systems, or brand are being built alongside client work.`;
  }

  if (type.includes("food") || type.includes("restaurant") || type.includes("beverage") || type.includes("fmcg")) {
    return `INDUSTRY CONTEXT — Food / Beverage / FMCG:
- Flag spoilage, shelf-life, and storage cost assumptions.
- Penalise if regulatory approval timelines are not factored in.
- Question whether taste preferences, cultural fit, and trend durability have been tested.
- Probe retail margin structures — grocery retail typically takes 40-50%.
- Flag dependence on a trend that may not sustain (e.g. health food fads).
- Check cold chain requirements and their impact on margin.`;
  }

  if (type.includes("health") || type.includes("medical") || type.includes("wellness") || type.includes("biotech")) {
    return `INDUSTRY CONTEXT — Health / Medical / Wellness:
- Flag regulatory pathway uncertainty — FDA, CE marking, TGA, or equivalent.
- Penalise if clinical evidence requirements are not acknowledged.
- Question liability, insurance, and professional endorsement strategy.
- Probe reimbursement model — who pays: patient, insurer, or employer?
- Flag if the founder conflates wellness (low regulation) with medical (high regulation).
- Check whether pilot study or clinical trial timelines are realistic.`;
  }

  if (type.includes("finance") || type.includes("fintech") || type.includes("insurance") || type.includes("lending")) {
    return `INDUSTRY CONTEXT — Fintech / Finance / Insurance:
- Flag licensing requirements — money transmission, banking, insurance, and investment licences are complex and slow.
- Penalise if regulatory compliance costs are not modelled.
- Question customer trust hurdles — financial products require extreme trust to adopt.
- Probe fraud and default risk in any lending or payment product.
- Flag data sovereignty and PCI-DSS / open banking compliance requirements.
- Check whether the founder has legal counsel experienced in financial regulation.`;
  }

  if (type.includes("education") || type.includes("edtech") || type.includes("learning")) {
    return `INDUSTRY CONTEXT — Education / EdTech:
- Flag long sales cycles — institutional education sales (schools, universities) take 12-18 months.
- Penalise if the founder targets schools without understanding procurement processes.
- Question evidence of learning outcomes — without measurable results, adoption stalls.
- Probe consumer EdTech churn — most users abandon learning products within 30 days.
- Flag whether the product competes with free alternatives (YouTube, Khan Academy).
- Check whether curriculum alignment or accreditation is required in the target market.`;
  }

  return `INDUSTRY CONTEXT — General:
- Apply standard startup readiness criteria.
- Flag any industry-specific regulatory risks mentioned in the answers.
- Penalise assumptions that are specific to one industry without evidence they apply to this one.
- Pay attention to whether the founder demonstrates domain fluency or is speaking in generalities.`;
}

export function buildEvaluationPrompt(
  founderName: string,
  startupIdea: string,
  answers: { question: string; answer: string; phase?: number }[],
  startupType?: string
): string {
  const qaBlock = groupAnswersByPhase(answers);
  const industryGuidance = getIndustryGuidance(startupType ?? "");

  const phaseScoreTemplate = Object.entries(PHASE_TITLES)
    .map(
      ([phase, title]) =>
        `    { "phase": ${phase}, "title": "${title}", "score": <1-10>, "note": "<one sentence on what drove this score>" }`
    )
    .join(",\n");

  return `You are a brutally honest, experienced startup advisor who has evaluated hundreds of startups. A founder named ${founderName} has answered structured questions across 14 dimensions of their idea.

YOUR ROLE: Surface uncomfortable truths. Identify excitement-mode thinking. Expose contradictions. Reward specificity and penalise vague platitudes. Do not soften assessments. Be direct, be specific, be honest.

STARTUP IDEA: ${startupIdea}
STARTUP TYPE: ${startupType ?? "Not specified"}

${industryGuidance}

CRITICAL EVALUATION RULES:
1. Vague answers (e.g. "people who need this", "everywhere", "social media", "it will go viral") must lower scores significantly. Specificity is evidence of real thinking.
2. Contradictions between phases (e.g. claiming niche focus in Phase 3 but mass market in Phase 4) must be flagged explicitly in the contradictions array.
3. "I haven't thought about this" or blank answers lower the phase score and must appear in gaps.
4. Excitement-mode language without evidence ("huge market", "no real competition", "everyone will want this") is a warning sign — flag it.
5. Reality score (0–100) measures how grounded in observable facts the founder is. 0 = pure fantasy, 100 = every claim backed by evidence and specific data.
6. Penalise founders who describe the solution when asked about the problem. They are solution-first thinkers — a common failure pattern.
7. Score phase 12 (Financial Reality) harshly if the founder cannot state costs, margins, or break-even with specific numbers.

ANSWERS:
${qaBlock}

Evaluate ${founderName}'s readiness to begin market validation. Now respond ONLY with valid JSON wrapped in <REPORT> tags. No text before or after the tags. Ensure the JSON is valid — no trailing commas, no comments.

<REPORT>
{
  "verdict": "READY",
  "verdictExplanation": "Two to three sentences. State the verdict and the single most important reason for it. Be direct.",
  "realityScore": 0,
  "phaseScores": [
${phaseScoreTemplate}
  ],
  "contradictions": [
    "Example: In Phase 3 the founder claims to target solo freelancers, but in Phase 4 claims the market is enterprises over 500 employees. These cannot both be the primary customer."
  ],
  "founderStressTest": {
    "solid": ["Specific strength with evidence from their answers", "Another specific strength"],
    "gaps": ["Specific gap — what they cannot answer or answered vaguely", "Another gap"],
    "notHonestWith": ["A belief they hold that contradicts the evidence in their own answers", "Another blind spot"]
  },
  "projectStressTest": {
    "coherent": ["What is logically consistent about this idea"],
    "structuralWeaknesses": ["A fundamental flaw in the idea's structure", "Another structural issue"],
    "unexaminedAssumptions": ["An assumption they have not tested and have not acknowledged", "Another unexamined assumption"]
  },
  "whatFounderDoesNotKnow": ["A critical thing they have not considered", "Another", "Another"],
  "mostDangerousAssumptions": ["The assumption that if wrong will kill the business fastest", "Another dangerous assumption", "A third"],
  "mustResolveBeforeValidation": ["The single most important question to answer before spending more time or money", "A second action", "A third action"],
  "nextSteps": ["Concrete next step — specific and actionable, not generic advice", "Second next step", "Third next step"],
  "killSignals": ["The specific scenario that would prove this idea should be abandoned", "A second kill signal"],
  "finalSummary": "One paragraph. The most important truth this founder needs to hear — not what they want to hear. If they are ready, explain precisely what readiness means for them and what could still derail it. If they are not ready, explain specifically why — not vaguely. Name the core unresolved question."
}
</REPORT>

Verdict must be exactly one of: "READY", "CONDITIONALLY READY", or "NOT READY".
realityScore must be an integer from 0 to 100.
Each phase score must be an integer from 1 to 10.
All arrays must have at least 2 items. contradictions may be an empty array [] if there are genuinely none.`;
}
