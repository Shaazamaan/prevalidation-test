export type Question = {
  phase: number;
  phaseTitle: string;
  question: string;
};

export const QUESTIONS: Question[] = [
  // Phase 1 — The Problem
  { phase: 1, phaseTitle: "The Problem", question: "Describe the problem your startup solves — not the solution, only the problem." },
  { phase: 1, phaseTitle: "The Problem", question: "When did you personally witness this problem happening to someone? Walk me through exactly what happened." },
  { phase: 1, phaseTitle: "The Problem", question: "How often does this problem occur in one person's life or work in a single month?" },
  { phase: 1, phaseTitle: "The Problem", question: "What is the worst thing that actually happens to someone because this problem exists — specifically?" },
  { phase: 1, phaseTitle: "The Problem", question: "When this problem occurs, what does the person do about it right now?" },
  { phase: 1, phaseTitle: "The Problem", question: "Does what they currently do solve it well enough that they stop caring about it?" },

  // Phase 2 — The Solution Logic
  { phase: 2, phaseTitle: "The Solution Logic", question: "Explain exactly how your solution eliminates the problem — step by step, from the moment someone encounters the problem to the moment your solution resolves it." },
  { phase: 2, phaseTitle: "The Solution Logic", question: "What is the simplest possible way this problem could be solved — even without technology, even manually?" },
  { phase: 2, phaseTitle: "The Solution Logic", question: "Why is your solution better than that simpler approach?" },
  { phase: 2, phaseTitle: "The Solution Logic", question: "What does your solution require the user to do that they are not doing today?" },
  { phase: 2, phaseTitle: "The Solution Logic", question: "What is the single weakest point in your solution — the part most likely to fail in the real world?" },

  // Phase 3 — The Customer
  { phase: 3, phaseTitle: "The Customer", question: "Forget markets and segments. Describe one specific person who is your first customer — their situation, their daily reality, and why this problem affects them right now." },
  { phase: 3, phaseTitle: "The Customer", question: "What is happening in that person's life or work right now that makes this problem urgent for them today?" },
  { phase: 3, phaseTitle: "The Customer", question: "What would that person need to see or experience to trust a brand new product they have never heard of?" },
  { phase: 3, phaseTitle: "The Customer", question: "Why would this person pay for your solution instead of continuing to do what they currently do?" },
  { phase: 3, phaseTitle: "The Customer", question: "Where does this person spend their time — physically and digitally — right now?" },

  // Phase 4 — The Assumptions
  { phase: 4, phaseTitle: "The Assumptions", question: "List every assumption your startup depends on to be true — not facts you know, assumptions you are making." },
  { phase: 4, phaseTitle: "The Assumptions", question: "Which of those assumptions, if wrong, means the entire startup stops making sense immediately?" },
  { phase: 4, phaseTitle: "The Assumptions", question: "For each of those foundational assumptions — what evidence do you currently have that it is true?" },
  { phase: 4, phaseTitle: "The Assumptions", question: "What is the assumption you are most afraid to test — because if it is wrong, you would have to stop?" },
  { phase: 4, phaseTitle: "The Assumptions", question: "What do you currently believe to be true about your customer that you have not actually confirmed with a real person outside your network?" },

  // Phase 5 — The Competition and Alternatives
  { phase: 5, phaseTitle: "The Competition and Alternatives", question: "What does your target customer currently do when this problem occurs — that is your real competition." },
  { phase: 5, phaseTitle: "The Competition and Alternatives", question: "Why has no one with more resources already built exactly what you are building?" },
  { phase: 5, phaseTitle: "The Competition and Alternatives", question: "What would make your customer stop doing what they currently do and switch to your solution instead?" },
  { phase: 5, phaseTitle: "The Competition and Alternatives", question: "What is the switching cost — in time, effort, money, or habit — for your customer to adopt your solution?" },
  { phase: 5, phaseTitle: "The Competition and Alternatives", question: "If a large, well-funded company decided to build your solution tomorrow, what would stop them from making you irrelevant?" },

  // Phase 6 — The Business Model Logic
  { phase: 6, phaseTitle: "The Business Model Logic", question: "Who exactly pays for your solution — and what specific outcome are they paying for?" },
  { phase: 6, phaseTitle: "The Business Model Logic", question: "Is the problem your solution solves a one-time problem or a recurring one — and does your business model match that reality?" },
  { phase: 6, phaseTitle: "The Business Model Logic", question: "How did you arrive at your pricing — what is the logic behind what you plan to charge?" },
  { phase: 6, phaseTitle: "The Business Model Logic", question: "Why would someone still be paying you six months after their first payment — what keeps them?" },
  { phase: 6, phaseTitle: "The Business Model Logic", question: "What single change in customer behavior, technology, or the market would make your business model stop working?" },

  // Phase 7 — The Operational Reality
  { phase: 7, phaseTitle: "The Operational Reality", question: "Walk me through exactly what happens operationally from the moment a customer decides to use your product to the moment they receive value — every step." },
  { phase: 7, phaseTitle: "The Operational Reality", question: "What is the hardest part of that process to get right consistently?" },
  { phase: 7, phaseTitle: "The Operational Reality", question: "What part of your delivery requires a human being to intervene — and have you accounted for that?" },
  { phase: 7, phaseTitle: "The Operational Reality", question: "What happens when a customer has a bad experience — exactly who handles it, how, and at what cost?" },
  { phase: 7, phaseTitle: "The Operational Reality", question: "What single external platform, supplier, regulation, or dependency does your entire operation rely on — and what happens if it changes or disappears?" },

  // Phase 8 — The Timing
  { phase: 8, phaseTitle: "The Timing", question: "Why does this startup need to be built right now — not two years ago, not two years from now?" },
  { phase: 8, phaseTitle: "The Timing", question: "What specific change — in technology, behavior, regulation, or the market — recently made this possible or necessary?" },
  { phase: 8, phaseTitle: "The Timing", question: "What trend, if it reverses, makes your solution irrelevant before it reaches enough people to matter?" },
  { phase: 8, phaseTitle: "The Timing", question: "What tells you the market is moving toward needing this — rather than away from it?" },

  // Phase 9 — Founder-Project Fit
  { phase: 9, phaseTitle: "Founder-Project Fit", question: "Why are you the right person to solve this problem — specifically, not generally?" },
  { phase: 9, phaseTitle: "Founder-Project Fit", question: "What do you know about this problem that someone reading about it for one month would not know?" },
  { phase: 9, phaseTitle: "Founder-Project Fit", question: "What is the single most important skill this startup needs in the next six months that you currently do not have — and how exactly will you fill that gap?" },
  { phase: 9, phaseTitle: "Founder-Project Fit", question: "Who is better positioned than you to build this — and why are you building it instead of them?" },
  { phase: 9, phaseTitle: "Founder-Project Fit", question: "What about this project are you most likely to get wrong — and what is your plan for that?" },

  // Phase 10 — Psychological Readiness
  { phase: 10, phaseTitle: "Psychological Readiness", question: "If the first twenty people you speak to during validation tell you they would not use or pay for this — what exactly would you do?" },
  { phase: 10, phaseTitle: "Psychological Readiness", question: "Have you actively looked for reasons this idea will not work — and what did you find?" },
  { phase: 10, phaseTitle: "Psychological Readiness", question: "What is the strongest argument against this idea that you have heard or thought of?" },
  { phase: 10, phaseTitle: "Psychological Readiness", question: "What would have to be true, coming out of validation, for you to decide to stop pursuing this?" },
  { phase: 10, phaseTitle: "Psychological Readiness", question: "Are you pursuing this because the evidence is pointing you toward it — or because you want it to be true?" },
];
