// ─── Subscription Confirmation Email Template ─────────────────────────────────

import { subscriptionStyles } from '../shared/styles';
import { pageWrapper, emailCard, headerBanner, emailFooter, ctaButton } from '../shared/components';
import { SITE_URL, formatIndianCurrency, formatDate } from '../shared/utils';

const FEATURES = [
  { icon: '📄', text: 'Unlimited Invoices',   desc: 'Create as many invoices as you need'   },
  { icon: '⬇️', text: 'Unlimited Downloads',  desc: 'Download in PDF format anytime'        },
  { icon: '📧', text: 'Gmail Integration',    desc: 'Send invoices directly from Gmail'     },
  { icon: '🎨', text: 'Custom Branding',      desc: 'Add your logo and brand colors'        },
  { icon: '⚡', text: 'Priority Support',     desc: '24/7 dedicated customer support'       },
];

export function subscriptionConfirmationHtml(
  userName: string,
  planName: string,
  amount: number,
  billingCycle: string,
  periodEnd: string,
): string {
  const formattedDate = formatDate(periodEnd);

  const featureRows = FEATURES.map(f => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
  <tr>
    <td width="44" style="padding:14px 0 14px 16px;" valign="top">
      <span style="font-size:20px;line-height:1;">${f.icon}</span>
    </td>
    <td style="padding:14px 16px 14px 0;" valign="top">
      <p style="margin:0 0 2px;font-size:14px;color:#1e293b;font-weight:600;">${f.text}</p>
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.4;">${f.desc}</p>
    </td>
  </tr>
</table>`).join('');

  const body = emailCard(`
    ${headerBanner({
      emoji: '🎉',
      title: 'Welcome to Pro!',
      subtitle: 'Your subscription is now active',
      gradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
    })}

    <!-- Greeting -->
    <tr>
      <td style="padding:32px 30px 20px;" class="mobile-padding">
        <h2 style="margin:0 0 12px;font-size:22px;color:#1e293b;font-weight:600;">Hi ${userName || 'there'}! 👋</h2>
        <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;" class="mobile-text">
          Thank you for upgrading to <strong style="color:#10b981;">${planName}</strong>! Your payment was successful and you now have full access to all premium features on InvoicePort.
        </p>
      </td>
    </tr>

    <!-- Payment Summary -->
    <tr>
      <td style="padding:0 30px 24px;" class="mobile-padding">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
          <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#4f46e5;">💳 Payment Summary</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;" class="sub-table">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Plan</td>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;">${planName}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Amount Paid</td>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;">₹${formatIndianCurrency(amount)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Billing Cycle</td>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;">${billingCycle}</td>
            </tr>
            <tr>
              <td style="padding:16px 0 0;font-size:14px;color:#64748b;">Valid Until</td>
              <td style="padding:16px 0 0;font-size:16px;color:#10b981;font-weight:700;text-align:right;">${formattedDate}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- What's Included -->
    <tr>
      <td style="padding:0 30px 24px;" class="mobile-padding">
        <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1e293b;">✨ What's Included</h3>
        ${featureRows}
      </td>
    </tr>

    <!-- Important Note -->
    <tr>
      <td style="padding:0 30px 24px;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:6px;">
          <tr>
            <td style="padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;" class="mobile-text">
                <strong>📌 Important:</strong> Your subscription does not auto-renew. You'll need to manually renew when your plan expires on <strong>${formattedDate}</strong>. We'll send you a reminder before expiration.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${ctaButton({
      href: `${SITE_URL}/dashboard`,
      label: '🚀 Go to Dashboard',
      subtext: 'Start creating professional invoices now!',
    })}

    ${emailFooter('Questions? We\'re here to help!')}
  `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Confirmed – InvoicePort</title>
  <style>${subscriptionStyles}</style>
</head>
${pageWrapper(body)}
</html>`;
}
