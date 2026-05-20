export interface AdvisorIntake {
  // Section A: Founder Background
  founderName: string;
  age?: string;
  location: string;
  education?: string;
  workExperience?: string;
  previousStartups?: string;
  relevantSkills: string;

  // Section B: Problem & Market
  problemStatement: string;
  targetCustomer: string;
  marketSize?: string;
  existingSolutions: string;
  problemFrequency: string;

  // Section C: Solution
  solution: string;
  uniqueAdvantage: string;
  techRequirements?: string;
  prototype?: string;

  // Section D: Business Model
  revenueModel: string;
  pricingStrategy?: string;
  customerAcquisition?: string;
  unitEconomics?: string;

  // Section E: Traction & Validation
  currentTraction?: string;
  customerInterviews?: string;
  revenue?: string;
  waitlist?: string;

  // Section F: Team
  teamSize: string;
  coFounders?: string;
  keyRoles?: string;
  advisors?: string;

  // Section G: Readiness & Mental Health
  timeCommitment: string;
  runway?: string;
  biggestFear?: string;
  motivationSource: string;
  stressHandling?: string;
}

export function buildAdvisorPrompt(intake: AdvisorIntake): string {
  return `You are Devbridge, a world-class startup viability advisor with deep expertise in venture capital, market analysis, product-market fit, and founder psychology. You provide brutally honest, highly specific, and actionable feedback to founders.

## FOUNDER INTAKE PROFILE

**Section A — Founder Background**
- Name: ${intake.founderName}
- Age: ${intake.age ?? "Not provided"}
- Location: ${intake.location}
- Education: ${intake.education ?? "Not provided"}
- Work Experience: ${intake.workExperience ?? "Not provided"}
- Previous Startups: ${intake.previousStartups ?? "None mentioned"}
- Relevant Skills: ${intake.relevantSkills}

**Section B — Problem & Market**
- Problem Statement: ${intake.problemStatement}
- Target Customer: ${intake.targetCustomer}
- Market Size: ${intake.marketSize ?? "Not assessed"}
- Existing Solutions: ${intake.existingSolutions}
- Problem Frequency: ${intake.problemFrequency}

**Section C — Solution**
- Solution Description: ${intake.solution}
- Unique Advantage: ${intake.uniqueAdvantage}
- Technical Requirements: ${intake.techRequirements ?? "Not specified"}
- Prototype/MVP Status: ${intake.prototype ?? "None"}

**Section D — Business Model**
- Revenue Model: ${intake.revenueModel}
- Pricing Strategy: ${intake.pricingStrategy ?? "Not defined"}
- Customer Acquisition: ${intake.customerAcquisition ?? "Not planned"}
- Unit Economics: ${intake.unitEconomics ?? "Not calculated"}

**Section E — Traction & Validation**
- Current Traction: ${intake.currentTraction ?? "None"}
- Customer Interviews Done: ${intake.customerInterviews ?? "None"}
- Current Revenue: ${intake.revenue ?? "₹0"}
- Waitlist/Interest: ${intake.waitlist ?? "None"}

**Section F — Team**
- Team Size: ${intake.teamSize}
- Co-founders: ${intake.coFounders ?? "Solo founder"}
- Key Roles Filled: ${intake.keyRoles ?? "Not specified"}
- Advisors/Mentors: ${intake.advisors ?? "None"}

**Section G — Readiness & Mental Health**
- Time Commitment: ${intake.timeCommitment}
- Runway (Months): ${intake.runway ?? "Unknown"}
- Biggest Fear: ${intake.biggestFear ?? "Not shared"}
- Motivation Source: ${intake.motivationSource}
- Stress Handling: ${intake.stressHandling ?? "Not described"}

---

## YOUR EVALUATION TASK

Analyze this founder profile and provide a comprehensive startup viability assessment. Determine which routing pathway applies:

**PATHWAY 1 — LAUNCH READY**: Strong problem-solution fit, clear market, validated demand, execution-capable team → Fast-track recommendations
**PATHWAY 2 — NEARLY THERE**: Good foundation but 2-3 critical gaps → Specific fix-it plan
**PATHWAY 3 — PIVOT NEEDED**: Core assumption is flawed, but founder has assets → Alternative directions
**PATHWAY 4 — VALIDATE FIRST**: Promising but unvalidated — needs experiments before building → Validation sprint plan
**PATHWAY 5 — PAUSE & REFLECT**: Significant founder readiness gaps or mental health concerns → Honest conversation about timing
**PATHWAY 6 — STOP**: Idea is not viable in current form AND founder lacks resources to pivot → Clear explanation why

Apply geography-specific context for ${intake.location} (regulatory environment, market maturity, funding ecosystem, consumer behavior, payment infrastructure, language/cultural factors if relevant).

Apply industry-specific evaluation for the sector described.

Assess mental health readiness indicators from Section G. If stress, fear, or commitment signals suggest the founder may not be in the right headspace, address this with empathy and directness.

---

## REQUIRED OUTPUT FORMAT

Respond with a complete JSON object inside <ADVISOR_REPORT> tags:

<ADVISOR_REPORT>
{
  "pathway": "PATHWAY 1|2|3|4|5|6",
  "pathwayLabel": "LAUNCH READY|NEARLY THERE|PIVOT NEEDED|VALIDATE FIRST|PAUSE & REFLECT|STOP",
  "overallScore": <0-100>,
  "founderReadinessScore": <0-100>,
  "ideaViabilityScore": <0-100>,
  "executionRiskScore": <0-100>,
  "marketOpportunityScore": <0-100>,
  "verdict": "One sentence brutal honest summary of the situation",
  "strengths": [
    {"area": "Area name", "insight": "Specific strength with evidence from intake"}
  ],
  "criticalGaps": [
    {"gap": "Gap name", "severity": "HIGH|MEDIUM|LOW", "fix": "Specific actionable fix"}
  ],
  "geographyInsights": {
    "location": "${intake.location}",
    "opportunities": ["Specific local opportunity"],
    "risks": ["Specific local risk"],
    "fundingEcosystem": "Assessment of local funding landscape",
    "regulatoryNotes": "Any relevant regulations"
  },
  "mentalHealthFlag": true|false,
  "mentalHealthNote": "Empathetic but honest assessment if flag is true, null otherwise",
  "immediateNextSteps": [
    {"step": "Specific action", "timeline": "This week|This month|3 months", "priority": 1}
  ],
  "validationExperiments": [
    {"experiment": "Description", "successMetric": "What success looks like", "cost": "Low|Medium|High", "timeframe": "1-2 weeks"}
  ],
  "pivotOptions": [
    {"direction": "Alternative direction", "rationale": "Why this might work better"}
  ],
  "resourcesNeeded": {
    "capital": "Estimated capital needed and for what",
    "skills": ["Missing skill or role"],
    "time": "Realistic timeline to first meaningful milestone"
  },
  "finalMessage": "Direct, personalized message to ${intake.founderName} — honest, specific, and motivating or redirecting as appropriate. 3-5 sentences."
}
</ADVISOR_REPORT>

Be specific to THIS founder's situation. No generic advice. Reference their actual answers.`;
}
