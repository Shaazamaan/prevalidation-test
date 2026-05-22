import { kv } from "@vercel/kv";

const SITE_URL = (process.env.NEXTAUTH_URL ?? "https://devbridgekerala.com").replace(/\/$/, "");

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

async function isEmailEnabled(): Promise<boolean> {
  try {
    return (await kv.get<boolean>("flag:email_enabled")) === true;
  } catch {
    return false;
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!(await isEmailEnabled())) return;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (!host || !user || !pass || !from) return;

  try {
    // Dynamic require — build succeeds without nodemailer installed.
    // Run: npm install nodemailer @types/nodemailer  when adding SMTP.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodemailer = require("nodemailer") as any;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  } catch {
    // Silently fail — email is optional, never block the main flow
  }
}

export async function sendPaymentReceiptEmail(opts: {
  to: string;
  founderName: string;
  tool: string;
  amountRs: number;
  orderId: string;
  invoiceNo?: string;
}): Promise<void> {
  const toolNames: Record<string, string> = {
    readiness: "Readiness Check",
    advisor: "Advisor Report",
    pitchdeck: "Pitch Deck Evaluation",
    pitch_practice: "Pitch Practice",
  };
  const toolName = toolNames[opts.tool] ?? opts.tool;
  const invoiceLine = opts.invoiceNo ? `<li><b>Invoice No:</b> ${opts.invoiceNo}</li>` : "";
  const invoiceText = opts.invoiceNo ? `\nInvoice No: ${opts.invoiceNo}` : "";

  await sendEmail({
    to: opts.to,
    subject: `Your Devbridge receipt — ${toolName}`,
    text: [
      `Hi ${opts.founderName},`,
      ``,
      `Thank you for your purchase.`,
      ``,
      `Tool: ${toolName}`,
      `Amount: ₹${opts.amountRs.toLocaleString("en-IN")}`,
      `Order ID: ${opts.orderId}${invoiceText}`,
      ``,
      `Your report is ready in your dashboard: ${SITE_URL}/dashboard`,
      ``,
      `Devbridge Team`,
    ].join("\n"),
    html: `
      <p>Hi ${opts.founderName},</p>
      <p>Thank you for your purchase.</p>
      <ul>
        <li><b>Tool:</b> ${toolName}</li>
        <li><b>Amount:</b> ₹${opts.amountRs.toLocaleString("en-IN")}</li>
        <li><b>Order ID:</b> ${opts.orderId}</li>
        ${invoiceLine}
      </ul>
      <p><a href="${SITE_URL}/dashboard">View your report in the dashboard →</a></p>
      <p>Devbridge Team</p>
    `,
  });
}

export async function sendStaleEvalEmail(opts: {
  to: string;
  name: string;
  score: number;
  verdict: string;
  daysAgo: number;
}): Promise<void> {
  const verdictShort = opts.verdict === "READY" ? "Ready" : opts.verdict === "CONDITIONALLY READY" ? "Conditionally Ready" : "Not Ready";
  await sendEmail({
    to: opts.to,
    subject: `Your startup evaluation is ${opts.daysAgo} days old — time to re-check?`,
    text: [
      `Hi ${opts.name},`,
      ``,
      `Your last Devbridge readiness check was ${opts.daysAgo} days ago.`,
      `At the time, you scored ${opts.score}/100 — ${verdictShort}.`,
      ``,
      `A lot changes in ${opts.daysAgo} days. If you've been working on your idea, chances are your score looks different now.`,
      ``,
      `Founders who re-evaluate after addressing feedback consistently score higher.`,
      ``,
      `Run a new evaluation → ${SITE_URL}`,
      ``,
      `Devbridge Team`,
    ].join("\n"),
    html: `
      <p>Hi ${opts.name},</p>
      <p>Your last Devbridge readiness check was <b>${opts.daysAgo} days ago</b>.</p>
      <p>At the time, you scored <b>${opts.score}/100</b> — ${verdictShort}.</p>
      <p>A lot changes in ${opts.daysAgo} days. If you've been working on your idea, chances are your score looks different now.</p>
      <p>Founders who re-evaluate after addressing feedback consistently score higher.</p>
      <p><a href="${SITE_URL}">Run a new evaluation →</a></p>
      <p>Devbridge Team</p>
    `,
  });
}

export async function sendWeeklyDigest(opts: {
  to: string;
  name: string;
  newFoundersThisWeek: number;
  feedPostsThisWeek: number;
  daysAgoLastEval?: number;
}): Promise<void> {
  const evalNudge = opts.daysAgoLastEval && opts.daysAgoLastEval >= 30
    ? `\nYour last evaluation was ${opts.daysAgoLastEval} days ago. Founders who re-evaluate after feedback consistently improve. → ${SITE_URL}\n`
    : "";

  await sendEmail({
    to: opts.to,
    subject: "This week at Devbridge — what's happening",
    text: [
      `Hi ${opts.name},`,
      ``,
      `Here's what happened in the Devbridge community this week:`,
      ``,
      `• ${opts.newFoundersThisWeek} new founders ran startup reality checks`,
      `• ${opts.feedPostsThisWeek} posts in the community feed`,
      ``,
      evalNudge,
      `→ Community feed: ${SITE_URL}/feed`,
      `→ Run an evaluation: ${SITE_URL}`,
      ``,
      `Devbridge Team`,
    ].join("\n"),
    html: `
      <p>Hi ${opts.name},</p>
      <p>Here's what happened in the Devbridge community this week:</p>
      <ul>
        <li><b>${opts.newFoundersThisWeek}</b> new founders ran startup reality checks</li>
        <li><b>${opts.feedPostsThisWeek}</b> posts in the community feed</li>
      </ul>
      ${opts.daysAgoLastEval && opts.daysAgoLastEval >= 30
        ? `<p>Your last evaluation was <b>${opts.daysAgoLastEval} days ago</b>. Founders who re-evaluate after feedback consistently improve.</p>`
        : ""}
      <p>
        <a href="${SITE_URL}/feed">Community feed →</a> &nbsp;|&nbsp;
        <a href="${SITE_URL}">Run an evaluation →</a>
      </p>
      <p>Devbridge Team</p>
    `,
  });
}

export async function sendDay1BreakdownEmail(opts: {
  to: string;
  name: string;
  score: number;
  verdict: string;
  sessionId: string;
}): Promise<void> {
  const verdictShort = opts.verdict === "READY" ? "Ready" : opts.verdict === "CONDITIONALLY READY" ? "Conditionally Ready" : "Not Ready";
  const siteUrl = SITE_URL;
  const reportUrl = `${siteUrl}/report/${opts.sessionId}`;
  const scoreMsg = opts.score >= 70
    ? `You're in the top tier of founders who've been through Devbridge. That score is a strong signal — don't let it sit idle.`
    : opts.score >= 45
    ? `A score of ${opts.score}/100 means your idea has real potential, but specific gaps need closing before you validate.`
    : `A score of ${opts.score}/100 is honest. The gaps flagged aren't roadblocks — they're your roadmap.`;

  await sendEmail({
    to: opts.to,
    subject: `Your Devbridge score: ${opts.score}/100 — here's what it means`,
    text: [
      `Hi ${opts.name},`,
      ``,
      `Your startup just scored ${opts.score}/100 — ${verdictShort}.`,
      ``,
      scoreMsg,
      ``,
      `The most important thing to do right now: go back and read the "Must Resolve Before Validation" section.`,
      `Those are the exact assumptions that will kill your idea if unchecked.`,
      ``,
      `Your full report: ${reportUrl}`,
      ``,
      `3 things founders with your score do next:`,
      `1. Run the Advisor Report — get a pathway-specific strategy (fundraising, bootstrap, or partnership)`,
      `2. Add your investors to the CRM — track who you're talking to`,
      `3. Post in the Founder Feed — share your stage and get real feedback`,
      ``,
      `Devbridge Team`,
    ].join("\n"),
    html: `
      <p>Hi ${opts.name},</p>
      <p>Your startup just scored <b>${opts.score}/100</b> — ${verdictShort}.</p>
      <p>${scoreMsg}</p>
      <p>The most important thing right now: read the <b>"Must Resolve Before Validation"</b> section of your report.</p>
      <p><a href="${reportUrl}">View your full report →</a></p>
      <p><b>3 things founders with your score do next:</b></p>
      <ol>
        <li><a href="${siteUrl}/advisor">Run the Advisor Report</a> — get a pathway-specific strategy</li>
        <li><a href="${siteUrl}/crm">Add investors to your CRM</a> — track your fundraising pipeline</li>
        <li><a href="${siteUrl}/feed">Post in the Founder Feed</a> — share your stage, get real feedback</li>
      </ol>
      <p>Devbridge Team</p>
    `,
  });
}

export async function sendDay3RecommendationsEmail(opts: {
  to: string;
  name: string;
  score: number;
  verdict: string;
}): Promise<void> {
  const siteUrl = SITE_URL;
  const tool = opts.score >= 60 ? "advisor" : opts.verdict === "NOT READY" ? "/" : "pitch-deck";
  const toolName = tool === "advisor" ? "Advisor Report" : tool === "/" ? "a fresh Readiness Check" : "Pitch Deck Evaluator";
  const toolUrl = `${siteUrl}/${tool === "/" ? "" : tool}`;
  const reason = tool === "advisor"
    ? `With a score of ${opts.score}, you're close to fundable. The Advisor Report gives you a specific pathway — bootstrap, raise, or partner — with the exact steps to get there.`
    : tool === "/"
    ? `In 3 days, you've likely learned things that change your answers. Founders who re-evaluate after reflection consistently score 10-15 points higher.`
    : `Your next step is stress-testing your pitch narrative. The Pitch Deck Evaluator catches investor red flags before they do.`;

  await sendEmail({
    to: opts.to,
    subject: `3 days in — what founders at your stage do next`,
    text: [
      `Hi ${opts.name},`,
      ``,
      `3 days ago, your startup scored ${opts.score}/100 on Devbridge.`,
      ``,
      `Here's what the sharpest founders at your stage do in week one:`,
      ``,
      reason,
      ``,
      `→ Try ${toolName}: ${toolUrl}`,
      ``,
      `Also: if you haven't set up your co-founder match profile yet, now's the time.`,
      `→ Find co-founders: ${siteUrl}/match`,
      ``,
      `Devbridge Team`,
    ].join("\n"),
    html: `
      <p>Hi ${opts.name},</p>
      <p>3 days ago, your startup scored <b>${opts.score}/100</b> on Devbridge.</p>
      <p>${reason}</p>
      <p><a href="${toolUrl}">Try ${toolName} →</a></p>
      <p>Also: if you haven't set up your co-founder match profile yet, now's a good time.</p>
      <p><a href="${siteUrl}/match">Find co-founders →</a></p>
      <p>Devbridge Team</p>
    `,
  });
}

export async function sendDay7CommunityEmail(opts: {
  to: string;
  name: string;
  score: number;
}): Promise<void> {
  const siteUrl = SITE_URL;
  await sendEmail({
    to: opts.to,
    subject: `One week in — your startup community is waiting`,
    text: [
      `Hi ${opts.name},`,
      ``,
      `You've been on Devbridge for a week now.`,
      ``,
      `Founders who engage with the community in their first week are 3x more likely to reach their next milestone.`,
      ``,
      `Three things worth doing this weekend:`,
      ``,
      `1. Write your first weekly journal entry — even 3 sentences on what you shipped, what you learned, and what's blocking you.`,
      `→ ${siteUrl}/journal`,
      ``,
      `2. Post in the Founder Feed — a win, a question, or a lesson. The community is real and responds fast.`,
      `→ ${siteUrl}/feed`,
      ``,
      `3. Share your referral link — every founder you invite gets a free evaluation. When they run it, you get one too.`,
      `→ ${siteUrl}/dashboard`,
      ``,
      `Devbridge Team`,
    ].join("\n"),
    html: `
      <p>Hi ${opts.name},</p>
      <p>You've been on Devbridge for a week.</p>
      <p>Founders who engage with the community in their first week are <b>3x more likely</b> to reach their next milestone.</p>
      <p><b>Three things worth doing this weekend:</b></p>
      <ol>
        <li><a href="${siteUrl}/journal">Write your first weekly journal entry</a> — even 3 sentences on what you shipped, learned, and what's blocking you.</li>
        <li><a href="${siteUrl}/feed">Post in the Founder Feed</a> — a win, a question, or a lesson. The community responds fast.</li>
        <li><a href="${siteUrl}/dashboard">Share your referral link</a> — every founder you invite gets a free evaluation. When they run it, you get one too.</li>
      </ol>
      <p>Devbridge Team</p>
    `,
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  referredBy?: string;
}): Promise<void> {
  const referralNote = opts.referredBy
    ? `\nYou joined via a referral link — a 5% welcome coupon has been added to your account.\n`
    : "";
  await sendEmail({
    to: opts.to,
    subject: "Welcome to Devbridge",
    text: [
      `Hi ${opts.name},`,
      ``,
      `Welcome to Devbridge — your AI co-pilot for building a fundable startup.`,
      referralNote,
      `Start your first readiness check: ${SITE_URL}`,
      ``,
      `Devbridge Team`,
    ].join("\n"),
    html: `
      <p>Hi ${opts.name},</p>
      <p>Welcome to Devbridge — your AI co-pilot for building a fundable startup.</p>
      ${opts.referredBy ? `<p>You joined via a referral link — a <b>5% welcome coupon</b> has been added to your account.</p>` : ""}
      <p><a href="${SITE_URL}">Start your first readiness check →</a></p>
      <p>Devbridge Team</p>
    `,
  });
}
