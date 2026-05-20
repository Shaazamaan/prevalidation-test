const FAQ_ITEMS = [
  {
    q: "What exactly does Devbridge evaluate?",
    a: "Devbridge uses Claude AI to analyse your startup across multiple dimensions — founder readiness, idea viability, market opportunity, traction, business model, and team strength. It's not cheerleading. It's the kind of honest assessment a good mentor would give.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your answers are stored securely in our database for 90 days and are never shared with third parties or used for AI training. After 90 days, your session data is automatically deleted.",
  },
  {
    q: "What if I disagree with the AI's verdict?",
    a: "The report is advisory, not final. AI can miss context that you haven't provided. Treat it as a structured second opinion from a knowledgeable but imperfect evaluator. You know your market better.",
  },
  {
    q: "How long does it take?",
    a: "Filling out the questionnaire or form takes 10–20 minutes. The AI generates your report in 30–60 seconds after you submit.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes. If the AI fails to generate a report due to a technical error, we will refund in full. If a report is generated, it is non-refundable as the AI evaluation has been delivered. See our Refund Policy.",
  },
  {
    q: "What's the difference between the three tools?",
    a: "Readiness Check is a 70-question deep-dive interrogation best for early-stage ideas. Advisor is a 7-section structured form best for ideas with some traction or clarity. Pitch Deck Validator analyses your uploaded deck for investor and grant readiness.",
  },
];

export default function FAQ() {
  return (
    <div className="mt-8 w-full max-w-lg">
      <h2 className="text-xs text-[#555] uppercase tracking-widest mb-4 text-center">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {FAQ_ITEMS.map((item, i) => (
          <details
            key={i}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden group"
          >
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none text-[#888] text-sm hover:text-white transition">
              <span>{item.q}</span>
              <span className="text-[#E8A838] text-xs ml-3 shrink-0 group-open:rotate-180 transition-transform duration-200">▾</span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <p className="text-[#555] text-xs leading-relaxed">{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
