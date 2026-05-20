export function downloadReceipt(data: {
  orderId: string;
  paymentId: string;
  founderName?: string;
  tool: string;
  reportUrl: string;
  amount: number;
  date: Date;
}) {
  const amountFormatted = data.amount === 0 ? "₹0 (Free — Coupon Applied)" : `₹${(data.amount / 100).toLocaleString("en-IN")}`;
  const dateStr = data.date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Devbridge Receipt — ${data.orderId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #fff; color: #111; padding: 40px; max-width: 600px; margin: 0 auto; }
  .header { border-bottom: 3px solid #E8A838; padding-bottom: 20px; margin-bottom: 28px; }
  .brand { font-size: 22px; font-weight: bold; color: #E8A838; letter-spacing: 2px; text-transform: uppercase; }
  .subtitle { font-size: 12px; color: #888; margin-top: 4px; }
  h2 { font-size: 18px; color: #111; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: top; }
  td:first-child { color: #666; width: 40%; font-family: Arial, sans-serif; }
  td:last-child { font-weight: 500; }
  .amount-row td { font-size: 15px; border-top: 2px solid #E8A838; border-bottom: 2px solid #E8A838; }
  .amount-row td:last-child { color: #E8A838; font-weight: bold; }
  .footer { font-size: 11px; color: #999; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin-top: 8px; }
  a { color: #E8A838; text-decoration: none; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div class="brand">Devbridge</div>
  <div class="subtitle">AI-Powered Startup Evaluation Platform · devbridgekerala.com</div>
</div>
<h2>Payment Receipt</h2>
<table>
  <tr><td>Date</td><td>${dateStr}</td></tr>
  <tr><td>Founder Name</td><td>${data.founderName ?? "—"}</td></tr>
  <tr><td>Product</td><td>${data.tool}</td></tr>
  <tr><td>Order ID</td><td style="font-family:monospace;font-size:11px">${data.orderId}</td></tr>
  <tr><td>Payment ID</td><td style="font-family:monospace;font-size:11px">${data.paymentId}</td></tr>
  <tr><td>Report URL</td><td><a href="${data.reportUrl}">${data.reportUrl}</a></td></tr>
  <tr class="amount-row"><td>Amount Paid</td><td>${amountFormatted}</td></tr>
</table>
<div class="footer">
  <p>This is an automatically generated receipt from Devbridge. The report linked above is an AI-generated advisory evaluation and does not constitute financial, legal, or investment advice.</p>
  <p style="margin-top:8px">For support: contact us via devbridgekerala.com</p>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devbridge-receipt-${data.orderId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
