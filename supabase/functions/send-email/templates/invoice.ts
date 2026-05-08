import { LOGO_URL, CURRENT_YEAR } from '../shared/utils.ts';

export function invoiceEmailHtml(
  userName: string,
  invoiceNumber: string,
  amount: string,
  currency: string,
  dueDate: string,
  verifyUrl: string,
  attachment: string | null = null
): string {
  const name = userName || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${invoiceNumber}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f9; padding: 60px 0; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px; text-align: center; }
    .content { padding: 40px; color: #334155; line-height: 1.7; }
    .invoice-badge { background-color: rgba(255, 255, 255, 0.2); color: #ffffff; display: inline-block; padding: 6px 16px; border-radius: 30px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
    .amount-display { margin: 24px 0; text-align: center; }
    .amount-label { color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 8px; }
    .amount-value { color: #0f172a; font-size: 42px; font-weight: 800; }
    .meta-table { width: 100%; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 30px; }
    .meta-cell { padding-bottom: 10px; }
    .meta-label { color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-value { color: #1e293b; font-size: 15px; font-weight: 600; }
    .button { display: block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 18px 30px; border-radius: 12px; font-weight: 700; font-size: 16px; text-align: center; margin-top: 30px; transition: all 0.2s; }
    .footer { text-align: center; padding: 30px 40px; color: #94a3b8; font-size: 13px; }
    .support-text { margin-top: 30px; font-size: 14px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="invoice-badge">New Invoice Received</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">#${invoiceNumber}</h1>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #0f172a; font-weight: 600; margin-bottom: 8px;">Hi there,</p>
        <p style="margin-top: 0;">You have received a new invoice from <strong>${name}</strong>. Here are the details of your outstanding balance.</p>
        
        <div class="amount-display">
          <div class="amount-label">Total Amount Due</div>
          <div class="amount-value">${currency}${amount}</div>
        </div>

        <table class="meta-table" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="meta-cell" width="50%">
              <div class="meta-label">Invoice Date</div>
              <div class="meta-value">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </td>
            <td class="meta-cell" width="50%" align="right">
              <div class="meta-label">Due Date</div>
              <div class="meta-value" style="color: #e11d48;">${dueDate}</div>
            </td>
          </tr>
          <tr>
            <td class="meta-cell">
              <div class="meta-label">Sender</div>
              <div class="meta-value">${name}</div>
            </td>
            <td class="meta-cell" align="right">
              <div class="meta-label">Invoice Number</div>
              <div class="meta-value">#${invoiceNumber}</div>
            </td>
          </tr>
        </table>

        <a href="${verifyUrl}" class="button">View & Pay Invoice</a>

        <div class="support-text">
          ${attachment ? 'For your convenience, we have attached a PDF copy of this invoice to this email.' : 'Click the button above to view and download your full PDF invoice securely online.'}
        </div>
      </div>
      <div class="footer">
        <p>This is a secure payment notification from <strong>InvoicePort</strong></p>
        <p>© ${CURRENT_YEAR} InvoicePort • Efficient Invoicing for Professionals</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
