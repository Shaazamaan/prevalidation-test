import "server-only";

export function buildEvaluationPrompt(
  founderName: string,
  startupIdea: string,
  answers: { question: string; answer: string }[]
): string {
  const qa = answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");

  return `You are a brutally honest startup readiness evaluator. A founder has answered 50 structured questions across 10 dimensions of their idea.

Founder: ${founderName}
Startup Idea: ${startupIdea}

ANSWERS:
${qa}

Evaluate their readiness to begin market validation. Be direct and honest. Identify what is solid, what is weak, what assumptions are unexamined, and what could kill the idea before it reaches customers.

Respond ONLY with valid JSON wrapped in <REPORT> tags. No other text before or after.

<REPORT>
{
  "verdict": "READY",
  "verdictExplanation": "Two sentence explanation of the verdict.",
  "founderStressTest": {
    "solid": ["strength 1", "strength 2"],
    "gaps": ["gap 1", "gap 2"],
    "notHonestWith": ["blind spot 1", "blind spot 2"]
  },
  "projectStressTest": {
    "coherent": ["coherent element 1"],
    "structuralWeaknesses": ["weakness 1", "weakness 2"],
    "unexaminedAssumptions": ["assumption 1", "assumption 2"]
  },
  "whatFounderDoesNotKnow": ["unknown 1", "unknown 2", "unknown 3"],
  "mostDangerousAssumptions": ["assumption 1", "assumption 2", "assumption 3"],
  "mustResolveBeforeValidation": ["action 1", "action 2", "action 3"],
  "killSignals": ["signal 1", "signal 2"],
  "finalSummary": "One paragraph. Brutally honest. The single most important thing this founder needs to hear."
}
</REPORT>

Verdict must be exactly one of: "READY", "CONDITIONALLY READY", or "NOT READY".`;
}
