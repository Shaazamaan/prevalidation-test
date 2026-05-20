export type Question = {
  phase: number;
  phaseTitle: string;
  question: string;
  hint: string;
  example: string;
};

export const QUESTIONS: Question[] = [
  // ─── Phase 1 — The Problem ───────────────────────────────────────────────────
  {
    phase: 1, phaseTitle: "The Problem",
    question: "Describe the problem your startup solves — not the solution, only the problem.",
    hint: "Focus entirely on the pain. Describe what actually happens to real people when this problem occurs. Do not mention your product, app, or idea at all.",
    example: "Small restaurant owners lose 15–20% of monthly revenue because they have no reliable way to predict daily demand. They either over-order inventory that spoils, or run out of popular items mid-service — damaging the customer experience and their reputation.",
  },
  {
    phase: 1, phaseTitle: "The Problem",
    question: "When did you personally witness this problem happening to someone? Walk me through exactly what happened.",
    hint: "Tell one specific story with a real person, a real situation, and real consequences. Not a generalised observation — a specific incident with specific details, emotions, and outcomes.",
    example: "My sister runs a bakery. Last March she ordered supplies for 200 cupcakes expecting a busy weekend. Only 40 sold. She spent $180 on ingredients that went to waste and felt completely defeated. She told me she guessed based on gut feel, as she always does.",
  },
  {
    phase: 1, phaseTitle: "The Problem",
    question: "How often does this problem occur in one person's life or work in a single month?",
    hint: "Give a specific number or range — not vague terms like 'frequently' or 'all the time'. Think about one specific person and count how many times the problem actually affects them in a month.",
    example: "For a restaurant owner, this happens every single day — they make an inventory order decision daily. In a month that is roughly 25–30 decisions, each one carrying the potential to waste money or disappoint customers.",
  },
  {
    phase: 1, phaseTitle: "The Problem",
    question: "What is the worst thing that actually happens to someone because this problem exists — specifically?",
    hint: "Go beyond inconvenience. What is the real, maximum negative consequence — financial, relational, professional, or emotional? The worst case that a real person could actually experience.",
    example: "A restaurant owner overstocks expensive seasonal ingredients three weeks in a row, loses $3,000, cannot make payroll, and has to let a staff member go. The stress damages relationships with the team and makes them question whether to continue the business.",
  },
  {
    phase: 1, phaseTitle: "The Problem",
    question: "When this problem occurs, what does the person do about it right now?",
    hint: "Describe their actual current behaviour — what they literally do in the moment. Not what they should do, not what you wish they did — what they actually do today.",
    example: "They check last week's sales on their POS system, glance at the weather forecast, ask their head chef how busy it felt last time, and make a gut decision. There is no structured process — just experience and instinct.",
  },
  {
    phase: 1, phaseTitle: "The Problem",
    question: "Does what they currently do solve it well enough that they stop caring about it?",
    hint: "Be honest. If people manage well enough with current solutions, that is critical information. Explain whether the pain persists despite current coping mechanisms — and by how much.",
    example: "No. They still over-order roughly 30% of the time. They have accepted it as 'part of the business' rather than a solvable problem — which actually makes acquisition harder, because the urgency to seek a solution is low.",
  },

  // ─── Phase 2 — The Solution Logic ───────────────────────────────────────────
  {
    phase: 2, phaseTitle: "The Solution Logic",
    question: "Explain exactly how your solution eliminates the problem — step by step, from the moment someone encounters the problem to the moment your solution resolves it.",
    hint: "Walk through the literal sequence of events. Be specific about what the user does, what your product does at each step, and the exact moment the pain disappears.",
    example: "Monday morning the owner opens the app, sees an AI-generated demand forecast for the week based on their sales history, local events, and weather. They click 'generate order' which pre-fills the supplier order form. They review and confirm in 3 minutes instead of guessing for 20.",
  },
  {
    phase: 2, phaseTitle: "The Solution Logic",
    question: "What is the simplest possible way this problem could be solved — even without technology, even manually?",
    hint: "Strip away all technology. What is the absolute bare-minimum human process that would address this — a spreadsheet, a notebook, a phone call, a conversation? Describe it honestly.",
    example: "The owner keeps a handwritten log of daily covers, weather, and local events for 6 months, then manually calculates averages by day type. Completely free, zero technology — just time, discipline, and basic arithmetic.",
  },
  {
    phase: 2, phaseTitle: "The Solution Logic",
    question: "Why is your solution better than that simpler approach?",
    hint: "Do not just say 'it is automated.' Explain specifically what your solution achieves that the manual approach cannot, and why that difference is worth paying for.",
    example: "The manual approach requires 6 months of consistent data before it is useful, and assumes the owner has time and discipline to maintain it. Our system is accurate from week 2 using industry benchmarks while local data builds, and surfaces patterns a human would miss — like 'rainy Tuesdays are always 40% slower than dry ones.'",
  },
  {
    phase: 2, phaseTitle: "The Solution Logic",
    question: "What does your solution require the user to do that they are not doing today?",
    hint: "Be honest about the behaviour change required. Every new product demands that users do something differently. What exactly is that change, and is it realistic for your specific customer?",
    example: "They need to open the app each Monday morning instead of relying on memory and habit. They also need to connect their POS system once during setup — a 15-minute process requiring their POS login credentials.",
  },
  {
    phase: 2, phaseTitle: "The Solution Logic",
    question: "What is the single weakest point in your solution — the part most likely to fail in the real world?",
    hint: "Do not pick a superficial weakness. Pick the actual structural vulnerability that could cause real users to get no value or abandon the product entirely.",
    example: "Forecast accuracy depends on consistent historical POS data. Restaurants that have changed systems, had recording gaps, or are newly opened will get unreliable forecasts for the first 2–3 months — exactly when trust is most fragile.",
  },

  // ─── Phase 3 — The Customer ──────────────────────────────────────────────────
  {
    phase: 3, phaseTitle: "The Customer",
    question: "Forget markets and segments. Describe one specific person who is your first customer — their situation, their daily reality, and why this problem affects them right now.",
    hint: "Give them a name, a job, a routine, and describe their day when this problem hits them. The more specific, the better. Generic personas are useless — a real, named individual is the goal.",
    example: "Maria, 44, owns a 35-seat Italian restaurant in a mid-sized city. She has been open 3 years, does the books herself on Sunday nights, and her biggest stress is the Monday morning supplier call. She uses Square POS but finds the reports confusing and does not look at them regularly.",
  },
  {
    phase: 3, phaseTitle: "The Customer",
    question: "What is happening in that person's life or work right now that makes this problem urgent for them today?",
    hint: "What specific recent event, seasonal pressure, competitive change, or personal situation has made this more acute right now — not generally, but today? Urgency drives action; comfort breeds inaction.",
    example: "Maria just came out of summer with her worst waste numbers ever — she over-ordered for a local festival that got rained out. Her accountant told her margins are tighter than he is comfortable with. She is actively looking for ways to cut costs this quarter.",
  },
  {
    phase: 3, phaseTitle: "The Customer",
    question: "What would that person need to see or experience to trust a brand new product they have never heard of?",
    hint: "Think about their specific fear — what could go wrong for them if this does not work? Address that fear specifically. Generic trust signals like 'good reviews' are not enough.",
    example: "Maria needs to see it working with Square POS specifically, a free trial with no credit card required, and a testimonial from another single-location restaurant owner — not a chain. She will not trust enterprise case studies.",
  },
  {
    phase: 3, phaseTitle: "The Customer",
    question: "Why would this person pay for your solution instead of continuing to do what they currently do?",
    hint: "The ROI calculation must be obvious and immediate. What is the specific financial or time saving that justifies the price within the first month — before they have fully decided to trust you?",
    example: "If Maria reduces food waste by even 10%, she saves roughly $400 per month. At $49 per month, the math is obvious within 3 weeks of use. The question is whether she believes it will actually work — hence the free trial with no commitment.",
  },
  {
    phase: 3, phaseTitle: "The Customer",
    question: "Where does this person spend their time — physically and digitally — right now?",
    hint: "Be specific about channels. Where do they actually discover new tools? Facebook groups? Trade publications? Word of mouth from their supplier? Google search at 11pm? This determines how you reach them.",
    example: "Maria is active in two Facebook groups for independent restaurant owners, reads a weekly email from her food supplier, and occasionally googles specific problems. She is not on LinkedIn or Twitter. The best way to reach her is through her supplier network.",
  },

  // ─── Phase 4 — The Assumptions ──────────────────────────────────────────────
  {
    phase: 4, phaseTitle: "The Assumptions",
    question: "List every assumption your startup depends on to be true — not facts you know, assumptions you are making.",
    hint: "Aim for at least 8–10 assumptions across customer behaviour, market size, willingness to pay, technology feasibility, distribution, and team capability. Most founders stop at 3 — push further.",
    example: "1. Owners feel this pain acutely enough to seek a solution. 2. They will connect their POS system to our platform. 3. Our forecast algorithm is accurate enough within 2–3 weeks. 4. $49/month is within their discretionary budget. 5. Word-of-mouth spreads within owner communities. 6. POS APIs remain accessible and reliable. 7. Owners will check the app weekly without reminders. 8. Suppliers will not build this themselves.",
  },
  {
    phase: 4, phaseTitle: "The Assumptions",
    question: "Which of those assumptions, if wrong, means the entire startup stops making sense immediately?",
    hint: "One assumption is always the load-bearing one. If it is false, there is no pivot — just no business. Identify it with brutal honesty, not the one that sounds most impressive to question.",
    example: "If restaurant owners will not connect their POS system — whether because of data trust concerns or setup complexity — we have no data, no forecast, and no product. Without POS connection, we are just a generic spreadsheet with a subscription fee.",
  },
  {
    phase: 4, phaseTitle: "The Assumptions",
    question: "For each of those foundational assumptions — what evidence do you currently have that it is true?",
    hint: "Separate what you know from observation versus what you believe from logic. 'It makes sense that...' is not evidence. What have you actually seen, heard, measured, or confirmed with a real person who is not in your network?",
    example: "Willingness to pay: 2 conversations where owners said they would pay 'something like $50' — but neither has committed money. POS connection: zero evidence, I assumed it. Forecast accuracy: one successful test on my own restaurant's data, which is not representative of the diversity of businesses I plan to serve.",
  },
  {
    phase: 4, phaseTitle: "The Assumptions",
    question: "What is the assumption you are most afraid to test — because if it is wrong, you would have to stop?",
    hint: "The one you are avoiding testing is almost always the most important one. Name it honestly. If you have been building instead of testing, this question is asking why.",
    example: "Whether owners will actually connect their POS. I have been avoiding this by building the algorithm first. If they refuse to grant data access due to privacy concerns, I have built the wrong product for the wrong customer entry point.",
  },
  {
    phase: 4, phaseTitle: "The Assumptions",
    question: "What do you currently believe to be true about your customer that you have not actually confirmed with a real person outside your network?",
    hint: "Friends and family give biased answers. What beliefs are you carrying that only a real paying stranger could confirm or deny? List them specifically.",
    example: "That owners check inventory manually every Monday morning. That they use their POS for historical reference. That they see this as a problem worth paying to solve rather than just an accepted cost of doing business. I have confirmed none of these with a stranger who has no reason to be kind to me.",
  },

  // ─── Phase 5 — The Competition and Alternatives ──────────────────────────────
  {
    phase: 5, phaseTitle: "The Competition and Alternatives",
    question: "What does your target customer currently do when this problem occurs — that is your real competition.",
    hint: "'Doing nothing' is almost never true. People always do something. What is the real behaviour that replaces your product right now? That behaviour — not another software product — is what you are actually competing with.",
    example: "They use gut instinct informed by a quick look at last week's POS summary, ask their chef, and check the weather. That is my real competition — not software. It costs them nothing, requires zero behaviour change, and they have done it for years.",
  },
  {
    phase: 5, phaseTitle: "The Competition and Alternatives",
    question: "Why has no one with more resources already built exactly what you are building?",
    hint: "This is one of the most important questions in startups. Either you have found a genuine gap, or you have missed an existing solution. Explain honestly which is true and why.",
    example: "Toast and Square have basic sales trend reports but no demand forecasting or automated ordering. They have not built it because their model is transaction fees — forecasting is adjacent, not core. Specialist tools exist for enterprise chains at $500+/month but nothing affordable for single-location independent owners.",
  },
  {
    phase: 5, phaseTitle: "The Competition and Alternatives",
    question: "What would make your customer stop doing what they currently do and switch to your solution instead?",
    hint: "The trigger for switching is almost always a specific event or threshold of pain — not a rational feature comparison. What moment pushes someone to search for an alternative? What makes them act?",
    example: "A particularly bad waste week, ideally after talking to another owner who already uses the product and describes a specific result. The switch happens in a moment of frustrated searching, not during calm planning.",
  },
  {
    phase: 5, phaseTitle: "The Competition and Alternatives",
    question: "What is the switching cost — in time, effort, money, or habit — for your customer to adopt your solution?",
    hint: "Do not underestimate habit. Changing what someone does every Monday morning is harder than it looks on paper. List every friction point in the adoption process.",
    example: "15 minutes to connect POS, learning a new Monday morning routine, $49 per month ongoing. The habit change is the biggest cost — the app only delivers value if they actually check it instead of defaulting to the gut-based process they have used for years.",
  },
  {
    phase: 5, phaseTitle: "The Competition and Alternatives",
    question: "If a large, well-funded company decided to build your solution tomorrow, what would stop them from making you irrelevant?",
    hint: "'First mover advantage' is not a real answer. What structural moat — proprietary data, deep relationships, community trust, switching costs from accumulated data — actually protects you?",
    example: "Nothing stops Toast from shipping this in 6 months. Our only real protection is getting deep into the independent owner community before they do, and building switching costs through 12+ months of each customer's historical data living in our system.",
  },

  // ─── Phase 6 — The Business Model Logic ─────────────────────────────────────
  {
    phase: 6, phaseTitle: "The Business Model Logic",
    question: "Who exactly pays for your solution — and what specific outcome are they paying for?",
    hint: "Be specific about the decision-maker and the exact outcome. Not 'businesses pay for efficiency' — who specifically signs off on the spend and what result do they need to see to justify it?",
    example: "The owner-operator pays, not the manager. They are paying to reduce the $300–500 per month they currently lose to food waste. The outcome they are buying is 'predictable inventory costs' — not 'AI forecasting technology.'",
  },
  {
    phase: 6, phaseTitle: "The Business Model Logic",
    question: "Is the problem your solution solves a one-time problem or a recurring one — and does your business model match that reality?",
    hint: "One-time problems suit one-time payments. Recurring problems suit subscriptions. If there is a mismatch between the nature of the problem and your pricing model, explain why.",
    example: "The problem recurs every week and every month — it never goes away. A subscription model matches this exactly. A one-time purchase would undervalue the ongoing benefit and create a perverse incentive to stop improving the product.",
  },
  {
    phase: 6, phaseTitle: "The Business Model Logic",
    question: "How did you arrive at your pricing — what is the logic behind what you plan to charge?",
    hint: "Do not say 'we looked at competitors.' Explain your value-based pricing logic: what specific outcome are you delivering and what fraction of that value are you charging?",
    example: "$49 per month is roughly 10–15% of the average monthly waste reduction we can demonstrably deliver — around $400 for a typical 35-seat restaurant. We are pricing to ROI, not to competitor benchmarks. If a customer saves $400, $49 is an obvious trade.",
  },
  {
    phase: 6, phaseTitle: "The Business Model Logic",
    question: "Why would someone still be paying you six months after their first payment — what keeps them?",
    hint: "Think beyond features. What makes cancelling feel like a loss — not just a saving? Data lock-in, community, accumulated intelligence, deepening habit — be specific about the retention mechanism.",
    example: "After 6 months their entire purchase history, seasonal patterns, and supplier relationships are embedded in our system. Cancelling means losing that accumulated intelligence and reverting to guessing. The product gets more accurate and more valuable the longer they use it.",
  },
  {
    phase: 6, phaseTitle: "The Business Model Logic",
    question: "What single change in customer behavior, technology, or the market would make your business model stop working?",
    hint: "Name the one specific scenario that ends the business model entirely — not a general risk category, but a specific event with a specific mechanism.",
    example: "If Square or Toast ships free demand forecasting as a native feature within their POS dashboard, our value proposition collapses overnight. They have all the data and all the customer relationships. This is the scenario that concerns me most and for which I have no good answer yet.",
  },

  // ─── Phase 7 — The Operational Reality ──────────────────────────────────────
  {
    phase: 7, phaseTitle: "The Operational Reality",
    question: "Walk me through exactly what happens operationally from the moment a customer decides to use your product to the moment they receive value — every step.",
    hint: "Every single step — signup, onboarding, first value moment, recurring use. Where do people drop off? Where does it break? Be honest about the steps that are not yet built or tested.",
    example: "Customer signs up, enters restaurant name and type, connects Square POS via OAuth (2 minutes), system pulls 90 days of sales history, generates first forecast within 24 hours. They see it on Monday, compare to what they would have ordered, place a test order using the suggestion. That is the first value moment — 48 hours after signup.",
  },
  {
    phase: 7, phaseTitle: "The Operational Reality",
    question: "What is the hardest part of that process to get right consistently?",
    hint: "Not technically hardest — operationally hardest to maintain reliably across many different customers with different setups, expectations, and edge cases.",
    example: "The POS connection. Every POS system has different APIs, different data formats, and different reliability. Square is solid. If we expand to Lightspeed or Revel, we must rebuild the entire data pipeline for each one. This does not scale cleanly and I have not solved it yet.",
  },
  {
    phase: 7, phaseTitle: "The Operational Reality",
    question: "What part of your delivery requires a human being to intervene — and have you accounted for that?",
    hint: "Most early products have manual steps hidden behind the scenes. What are yours? Name them. What happens when volume makes those manual steps impossible to sustain?",
    example: "When a new POS type requests access, someone needs to manually test the data pipeline. Currently that person is me. At 100 customers on 5 different POS systems, this is not sustainable and I have not yet designed a solution for it.",
  },
  {
    phase: 7, phaseTitle: "The Operational Reality",
    question: "What happens when a customer has a bad experience — exactly who handles it, how, and at what cost?",
    hint: "Be specific about the process, the person responsible, the time cost per incident, and the financial cost. Then project what this looks like at 10x your current scale.",
    example: "If the forecast is badly wrong and they over-ordered based on it, they will email us angry. Currently I respond within 24 hours, investigate the data pipeline, and offer a month free. That costs $49 and about 2 hours of my time. At 500 customers I cannot handle more than 2–3 of these per week before it consumes my entire schedule.",
  },
  {
    phase: 7, phaseTitle: "The Operational Reality",
    question: "What single external platform, supplier, regulation, or dependency does your entire operation rely on — and what happens if it changes or disappears?",
    hint: "The dependency that would be catastrophic if it disappeared overnight — not an inconvenience, but an existential threat to delivery. Do you have a contingency?",
    example: "Square's POS API. If they change their developer program terms, restrict third-party access, or deprecate the API endpoints we use, our core product stops working for the majority of customers immediately. We have no contractual protection and no contingency built yet.",
  },

  // ─── Phase 8 — The Timing ────────────────────────────────────────────────────
  {
    phase: 8, phaseTitle: "The Timing",
    question: "Why does this startup need to be built right now — not two years ago, not two years from now?",
    hint: "'The market is ready' is not an answer. What specific event, technology breakthrough, or behavioural shift makes right now the exact right moment — and makes waiting even 12 months a strategic error?",
    example: "Three things converged in the last 18 months: POS systems standardised their APIs making integration viable for the first time, food costs increased 30% post-inflation making waste far more painful, and AI forecasting became cheap enough to run at small business scale.",
  },
  {
    phase: 8, phaseTitle: "The Timing",
    question: "What specific change — in technology, behavior, regulation, or the market — recently made this possible or necessary?",
    hint: "Name the specific change with a rough date. 'Technology improved' is not enough. What exactly changed, when, and why does that change make your solution possible now when it was not before?",
    example: "Square opened their full sales data API to third parties in 2022. Before that, we could not access the historical data needed for forecasting. Without that API, this specific product literally could not exist — not because of difficulty, but because the data was inaccessible.",
  },
  {
    phase: 8, phaseTitle: "The Timing",
    question: "What trend, if it reverses, makes your solution irrelevant before it reaches enough people to matter?",
    hint: "Identify the macro trend your business depends on continuing. What is the specific reversal scenario and how quickly would it make your solution unnecessary or unprofitable?",
    example: "If food costs return to pre-2020 levels, waste becomes a minor irritant rather than a critical business problem. Owners would still benefit from forecasting but the urgency and willingness to pay would drop significantly — likely making our current pricing unjustifiable.",
  },
  {
    phase: 8, phaseTitle: "The Timing",
    question: "What tells you the market is moving toward needing this — rather than away from it?",
    hint: "Specific evidence — data points, published research, news trends, observable behaviour changes — not intuition or hope. What concrete signals confirm the direction of travel?",
    example: "Restaurant industry waste costs are up 40% since 2021 per the National Restaurant Association. Food cost as a percentage of revenue has hit historic highs. Three competitors entered the enterprise segment in the last 2 years — none serving independent owners — which confirms the problem is real and the enterprise market is being addressed.",
  },

  // ─── Phase 9 — Founder-Project Fit ──────────────────────────────────────────
  {
    phase: 9, phaseTitle: "Founder-Project Fit",
    question: "Why are you the right person to solve this problem — specifically, not generally?",
    hint: "Not 'I am passionate about this.' What specific unfair advantage do you have? Domain expertise, relationships, lived experience, technical capability — something that gives you an edge a well-funded generalist does not have.",
    example: "I ran a restaurant for 4 years and experienced this exact problem every Monday. I know precisely how the purchase decision is made, who makes it, what information they use, and where the process breaks down. Most software founders building for restaurants have never stood at that ordering desk.",
  },
  {
    phase: 9, phaseTitle: "Founder-Project Fit",
    question: "What do you know about this problem that someone reading about it for one month would not know?",
    hint: "The non-obvious insight that only comes from deep domain experience or genuinely obsessive research — something that would surprise even an informed outsider.",
    example: "Restaurant owners do not trust forecasts from systems they do not understand. The product must show its reasoning — not just say '40 covers expected Tuesday' but show 'based on last 3 rainy Tuesdays.' Without that transparency they override the forecast every time and it becomes useless.",
  },
  {
    phase: 9, phaseTitle: "Founder-Project Fit",
    question: "What is the single most important skill this startup needs in the next six months that you currently do not have — and how exactly will you fill that gap?",
    hint: "One skill, honestly assessed. Not 'marketing' — be specific about what type, what you would need to learn, how long it will take, and what your concrete plan is to acquire it.",
    example: "Sales. I can build the product but I have never closed a deal with a business owner. My plan: do 20 sales calls personally in the next 60 days before considering hiring anyone. I am also taking a short course on consultative selling this month.",
  },
  {
    phase: 9, phaseTitle: "Founder-Project Fit",
    question: "Who is better positioned than you to build this — and why are you building it instead of them?",
    hint: "Name a realistic competitor or more qualified person. Then genuinely explain why you are continuing despite that. 'No one is better positioned' is almost never the honest answer.",
    example: "A former Square or Toast product manager with existing relationships would be better positioned for distribution. I am building it because I have 4 years of lived operator experience they do not, I have already built the POS integration layer, and no one in that position appears to be doing it.",
  },
  {
    phase: 9, phaseTitle: "Founder-Project Fit",
    question: "What about this project are you most likely to get wrong — and what is your plan for that?",
    hint: "The honest answer specific to your personality, background, and blind spots — not a managed weakness designed to sound self-aware. The real failure mode that someone who knows you well would name.",
    example: "I will build too much before validating. I default to building solutions to problems I perceive rather than confirming them with customers first. My plan: I have agreed with a co-founder that I ship no new features until we have 10 paying customers. He holds me accountable to this.",
  },

  // ─── Phase 10 — Psychological Readiness ─────────────────────────────────────
  {
    phase: 10, phaseTitle: "Psychological Readiness",
    question: "If the first twenty people you speak to during validation tell you they would not use or pay for this — what exactly would you do?",
    hint: "Describe the specific actions you would take — not the emotions you would feel. What would you literally do, step by step, in the week after that result?",
    example: "I would transcribe all 20 conversations, identify the consistent objection, and determine whether it is a positioning problem, a product problem, or a market problem. If it is the market, I would pivot to catering businesses — same inventory problem, higher stakes, potentially more willingness to pay.",
  },
  {
    phase: 10, phaseTitle: "Psychological Readiness",
    question: "Have you actively looked for reasons this idea will not work — and what did you find?",
    hint: "List the actual reasons you found through adversarial thinking. Not 'I looked and it seems fine' — what specific flaws, risks, or structural problems did the honest self-examination surface?",
    example: "Three things: the POS API dependency is a single point of failure with no contractual protection. Restaurant owner churn is high — many close in year 1, taking our revenue with them. The problem may not be painful enough pre-crisis to drive active searching for a solution. I have not found a satisfying answer to the third one.",
  },
  {
    phase: 10, phaseTitle: "Psychological Readiness",
    question: "What is the strongest argument against this idea that you have heard or thought of?",
    hint: "The most compelling counter-argument — the one that actually makes you pause, not the straw-man version you can easily dismiss. If you cannot state it powerfully, you probably have not fully heard it.",
    example: "Square will ship this natively. They have all the data, all the customers, a distribution channel we cannot replicate, and every reason to add forecasting to their dashboard for free. If they do that, we are building a feature, not a company. I cannot fully counter this argument.",
  },
  {
    phase: 10, phaseTitle: "Psychological Readiness",
    question: "What would have to be true, coming out of validation, for you to decide to stop pursuing this?",
    hint: "Specific, measurable stopping conditions — not 'if things do not work out.' What precise findings would trigger you to stop? Have you written these down and shared them with someone who will hold you accountable?",
    example: "If fewer than 3 of 20 interviewed owners say they would pay $49/month unprompted, or if POS API access is refused by more than 40% of interested owners. I have written this down and shared it with my co-founder so we are both accountable to the conditions we set before we were emotionally invested in a result.",
  },
  {
    phase: 10, phaseTitle: "Psychological Readiness",
    question: "Are you pursuing this because the evidence is pointing you toward it — or because you want it to be true?",
    hint: "Both can be simultaneously true — but be specific about what the evidence actually shows versus what you are hoping it shows. The honest answer to this question is one of the most valuable things you can know right now.",
    example: "Honestly, both. I want it to be true because I lived the pain personally. The evidence pointing toward it: 3 owners expressed genuine frustration in unbiased interviews. The evidence I may be ignoring: none of them have offered to pay me anything yet. I am still pre-revenue with zero financial commitment from anyone.",
  },

  // ─── Phase 11 — Launch Reality & Failure Planning ────────────────────────────
  {
    phase: 11, phaseTitle: "Launch Reality & Failure Planning",
    question: "What are the top 3 specific reasons THIS startup will fail — not generic startup risks, but reasons unique to your idea, your market, and your personal situation?",
    hint: "Generic answers like 'running out of money' or 'competition' do not count. Name the three failure modes that are specific to you and this idea — the ones a knowledgeable insider would immediately identify.",
    example: "1. Square ships demand forecasting natively before we reach 100 customers, collapsing our value proposition. 2. Restaurant owners refuse POS API access due to data privacy concerns — the assumption I have not tested. 3. I fail to convert beta users to paid because I keep delaying the sales conversation, which is my established pattern.",
  },
  {
    phase: 11, phaseTitle: "Launch Reality & Failure Planning",
    question: "When you launch, what is the first thing that will break — in your product, your process, or your assumptions — and what is your exact plan when it happens?",
    hint: "Every launch has something break. It is not a question of if but what. What is the most predictable first failure, and what have you prepared to do when it occurs?",
    example: "The POS connection will fail for anyone not using Square. I have only built and tested the Square integration. My plan: clearly state 'Square only for now' at signup, build a waitlist for other POS systems, and prioritise Lightspeed integration based on waitlist demand.",
  },
  {
    phase: 11, phaseTitle: "Launch Reality & Failure Planning",
    question: "What is the most common negative reaction you expect from potential customers — and what is your prepared, honest response to it?",
    hint: "The real objection you will hear most often — not the easiest one to handle, but the most common one. Then give your actual response, not the one that sounds good in a pitch.",
    example: "The most common objection: 'Why would I trust your forecast over my own experience? I have been doing this for 12 years.' My honest response: 'You should not trust it initially. Use it alongside your own judgment for 4 weeks and compare the results. We will show you exactly where it was right and where it was wrong.'",
  },
  {
    phase: 11, phaseTitle: "Launch Reality & Failure Planning",
    question: "Who has told you this idea will not work, and what exactly did they say? If no one has challenged it seriously, why not?",
    hint: "If you cannot name a real person who challenged your idea and the exact argument they made, that is itself a red flag. Surrounding yourself only with supporters is one of the most common early mistakes.",
    example: "My accountant friend said 'restaurant owners do not invest in software — they buy equipment.' That challenge made me realise I need to frame this as a cost-reduction tool, not a technology investment. That reframe changed my entire pitch and pricing justification.",
  },
  {
    phase: 11, phaseTitle: "Launch Reality & Failure Planning",
    question: "What does a version of this startup look like that appears to be working on the outside but is dying slowly on the inside — and what early warning signal will tell you that is happening?",
    hint: "Describe the specific scenario where vanity metrics look good but the business is fundamentally broken. Then name the one metric or observation that would reveal this before it becomes irreversible.",
    example: "We have 200 free trial signups and positive press coverage — but only 12% convert to paid because owners never complete POS setup. The funnel looks healthy at the top but is broken at activation. The early warning signal: if week-2 POS connection rate falls below 40%, we have an onboarding crisis, not a marketing success.",
  },

  // ─── Phase 12 — Financial Reality Check ─────────────────────────────────────
  {
    phase: 12, phaseTitle: "Financial Reality Check",
    question: "List every cost involved in delivering your product or service to one customer — include infrastructure, tools, support time, payment processing, and your own time valued honestly.",
    hint: "Nothing is free. Include server costs, third-party API fees, payment processing (usually 2.9% + $0.30), average support time per customer per month at an honest hourly rate, and your own time allocated per customer. Calculate the true cost of serving one customer.",
    example: "Server: $0.40/customer/month. POS API calls: $0.15. Payment processing: $1.50 (Stripe 3%). Support: average 30 min/month at $50/hour = $25. My time on product allocated per customer: ~$8. Total: ~$35/customer/month. At $49 price, gross margin is 28% — dangerously thin at early scale.",
  },
  {
    phase: 12, phaseTitle: "Financial Reality Check",
    question: "What is your realistic customer acquisition cost — and what is that estimate based on, specifically?",
    hint: "Not your target CAC — your realistic CAC based on what acquisition channels actually cost for your specific audience. Have you tested any channel? If not, what comparable data are you using?",
    example: "Based on comparable B2B SaaS targeting small business owners: $150–300 via paid ads, $80–120 via content/SEO after 12 months of investment, approximately $40 via owner referral. I am planning referral-first but I have zero referral proof points — this is an assumption, not a measurement.",
  },
  {
    phase: 12, phaseTitle: "Financial Reality Check",
    question: "How many paying customers do you need per month to cover all your costs — including your personal living expenses?",
    hint: "Include EVERYTHING: infrastructure, tools, subscriptions, software, accountant, legal, and your own living costs if working full-time on this. Then calculate how many customers at your price point covers that number.",
    example: "Personal living: $3,000/month. Infrastructure and tools: $400/month. Total: $3,400. At $49/month per customer with 28% gross margin, I need approximately 240 customers to cover costs. At my current conversion rate, that is 14–18 months away from today — beyond my financial runway.",
  },
  {
    phase: 12, phaseTitle: "Financial Reality Check",
    question: "What is your personal financial runway — how many months can you sustain yourself with zero revenue before you are forced to stop?",
    hint: "Give a specific number of months. Include partner or family income if genuinely reliable. Your runway determines your decision deadline — be precise, not optimistic.",
    example: "I have $18,000 saved. At $2,800/month personal expenses, I have 6.4 months of runway. After that I must either have sufficient revenue to sustain myself or return to employment. My absolute decision deadline is the end of month 6 — regardless of emotional attachment to the project.",
  },
  {
    phase: 12, phaseTitle: "Financial Reality Check",
    question: "What happens to your costs and margins when you go from 10 to 1,000 customers — do they improve, stay flat, or worsen, and why?",
    hint: "Model this specifically. Which costs scale linearly with customers? Which are fixed? Which actually get worse as you scale (like support)? When do you need to make your first hire and what does that cost?",
    example: "Infrastructure scales roughly linearly ($0.40/customer). Support actually worsens initially as POS diversity increases. My time becomes the constraint at roughly 150 customers. First hire adds $4,000/month fixed cost. Margins improve meaningfully only after 300+ customers once my time cost per customer drops through product improvements.",
  },

  // ─── Phase 13 — Industry-Specific Risk ──────────────────────────────────────
  {
    phase: 13, phaseTitle: "Industry-Specific Risk",
    question: "What are the characteristic failure modes of your specific business type that most founders in your category fail to plan for?",
    hint: "Tech/SaaS: API dependency, platform risk, security/compliance costs. Physical product: dead stock, expiry, MOQ traps, trend collapse. Service: time-for-money ceiling, key-person dependency, market saturation. Marketplace: chicken-and-egg, disintermediation. Name the ones that apply to you.",
    example: "(Tech) API dependency on Square with no contractual protection. Platform risk if Square builds this natively. Sudden compliance cost if we cross a user threshold triggering SOC2 requirements. (Product) Dead stock if the product does not sell — $9,000 committed at minimum order quantity. (Service) I am the service — my absence means zero revenue.",
  },
  {
    phase: 13, phaseTitle: "Industry-Specific Risk",
    question: "Give specific numbers: for tech, what are your infrastructure costs at 100 and 10,000 users? For physical product, what is your MOQ and dead stock scenario? For services, what is your maximum capacity and revenue ceiling?",
    hint: "This is a financial stress test specific to your business type. Vague answers reveal that you have not done this modelling. Run the numbers now if you have not.",
    example: "(Tech) 100 users: $40/month infrastructure. 10,000 users: $4,000/month — I have modelled this. (Product) MOQ is 200 units at $45 each = $9,000 committed. If fewer than 40% sell in 90 days, I face a $5,400 loss on the first run. Dead stock plan: deep discount at day 60, donate remainder for tax benefit. (Service) Maximum 8 clients at full quality. Revenue ceiling: $12,000/month before I must hire.",
  },
  {
    phase: 13, phaseTitle: "Industry-Specific Risk",
    question: "What licenses, permits, certifications, or regulatory approvals does your business require to legally operate — and have you confirmed this with a legal or industry professional?",
    hint: "This applies to every business type. Have you confirmed the regulatory landscape — not assumed it — ideally with a professional rather than Google? What did you find?",
    example: "Handling restaurant purchase data as a third party requires registration under the data protection framework in my jurisdiction — $800 to register, 3-week process. I spoke to a lawyer last month. I have not registered yet. If I process any customer data before registering I am technically non-compliant from day one.",
  },
  {
    phase: 13, phaseTitle: "Industry-Specific Risk",
    question: "What single external factor — a platform, supplier, regulation, competitor, or market trend — could make your business model illegal, impossible, or irrelevant overnight? What is your contingency?",
    hint: "The catastrophic external dependency. Not a risk you can manage — the one where if it changes, the business model breaks entirely. Do you have a contingency for this scenario?",
    example: "Square changing their API terms. In 2021 they restricted access for certain use cases without warning. We have no contractual protection. If they close third-party API access, our core product stops working for the majority of customers the next day. My contingency: actively build integrations with 2 other POS systems so no single platform is more than 40% of our customer base.",
  },
  {
    phase: 13, phaseTitle: "Industry-Specific Risk",
    question: "What insurance does your business need — product liability, professional indemnity, data breach, cyber liability — and have you gotten actual quotes?",
    hint: "Most founders skip this entirely. Depending on your business type, missing the right insurance can be existential. What applies to your specific situation and have you costed it into your financial model?",
    example: "Cyber liability for handling POS data: approximately $1,200/year. Professional indemnity for software influencing purchasing decisions: ~$800/year. Total: ~$2,000/year, or $167/month — not modelled in my unit economics until now. I have gotten quotes but not yet purchased. This needs to happen before we go live with any paying customer.",
  },

  // ─── Phase 14 — Team, Legal & Knowledge Gaps ─────────────────────────────────
  {
    phase: 14, phaseTitle: "Team, Legal & Knowledge Gaps",
    question: "If you have co-founders, have you explicitly agreed on equity split, roles, decision authority, and what happens if one of you wants to leave? If solo, what is your concrete plan for the critical skills you do not have?",
    hint: "'We have talked about it informally' is not sufficient. Have you documented it, signed something, or at minimum written it down? What specifically happens if a co-founder leaves in year 1 before anything is built?",
    example: "My co-founder and I have a founders' agreement drafted by a lawyer: 50/50 with 4-year vesting and a 1-year cliff. If either leaves before the cliff, they leave with nothing. After the cliff, pro-rated. Decision rights are defined: I am final on product decisions, she is final on commercial decisions. We documented this before either of us wrote a line of code.",
  },
  {
    phase: 14, phaseTitle: "Team, Legal & Knowledge Gaps",
    question: "What are the three most important knowledge domains this startup requires — and what is your honest self-rating in each on a scale of 1 to 10?",
    hint: "Rate yourself honestly. A 7 that you call an 8 will cost you. Low scores need a specific acquisition plan — not 'I will learn' but exactly how, by when, and at what cost.",
    example: "1. Restaurant operations: 9/10 — ran one for 4 years. 2. Software engineering: 7/10 — competent but the data pipeline work is at the edge of my skill set. 3. B2B sales: 2/10 — I have never sold anything to a business owner. Plan for sales: 20 personal sales calls in the next 60 days plus a consultative selling course this month. No hiring until I understand the process myself.",
  },
  {
    phase: 14, phaseTitle: "Team, Legal & Knowledge Gaps",
    question: "What does a founder who has already failed in this exact space know that you do not — and how will you learn it before you repeat their mistake?",
    hint: "Research this specifically. Find failed competitors, adjacent failures, or people who tried this and stopped. What did they learn the hard way? 'I could not find any' suggests you did not look hard enough.",
    example: "I found a startup called MenuMetrics that tried this in 2019 and shut down. From their public post-mortem, the main issue was that owners would not connect their POS due to data trust concerns — the exact assumption I have been making without testing. I reached out to the founder on LinkedIn and we have a call next week.",
  },
  {
    phase: 14, phaseTitle: "Team, Legal & Knowledge Gaps",
    question: "Have you spoken to a lawyer about your business structure, intellectual property ownership, and liability exposure — and what were the key findings?",
    hint: "If not, say so honestly and explain what is stopping you. If yes, what specifically did you learn that changed how you are building or structuring the business?",
    example: "Yes, one 90-minute consultation last month. Key findings: I need to incorporate before taking any payment — personal liability risk is significant. My IP assignment from a previous employer may conflict with this product and needs a formal review. The POS data we process makes us a data processor under GDPR, requiring a signed data processing agreement with every customer before we touch their data.",
  },
  {
    phase: 14, phaseTitle: "Team, Legal & Knowledge Gaps",
    question: "What is the one area of this business where your ignorance is most dangerous right now — and what is your concrete plan to close that gap before you begin validation?",
    hint: "The domain where you do not know what you do not know — and where that ignorance could cause irreversible damage if left unaddressed. Be specific about the plan: what, how, and by when.",
    example: "GDPR and data compliance. I am handling purchase data from restaurant customers without fully understanding my obligations as a data processor. A compliance failure here is potentially existential — regulatory fines, reputational damage with the exact audience I need to trust me. My plan: I am hiring a compliance consultant for a 4-hour engagement next week specifically to map my obligations before we process a single customer's data.",
  },
];
