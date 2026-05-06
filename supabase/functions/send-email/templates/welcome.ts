// ─── Welcome Email Template ───────────────────────────────────────────────────

import { SITE_URL, LOGO_URL, SUPPORT_EMAIL, CURRENT_YEAR } from '../shared/utils';

export function welcomeEmailHtml(userName: string): string {
  const name = userName || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to InvoicePort</title>
  <style>
    @media only screen and (max-width: 600px) {
      .wrap      { width: 100% !important; }
      .mob-pad   { padding: 24px 20px !important; }
      .mob-title { font-size: 26px !important; line-height: 1.2 !important; }
      .mob-sub   { font-size: 14px !important; }
      .stat-cell { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; text-align: center !important; }
      .stat-gap  { display: none !important; }
      .pro-cell  { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; }
      .pro-gap   { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table class="wrap" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

      <!-- HERO -->
      <tr>
        <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:48px 40px 32px;text-align:center;" class="mob-pad">
          <img src="${LOGO_URL}" width="64" height="64" alt="InvoicePort" style="display:block;margin:0 auto 20px;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,0.25);" />
          <h1 style="margin:0 0 10px;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:-0.5px;line-height:1.15;" class="mob-title">You're all set 🎉</h1>
          <p style="margin:0 0 28px;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.5;" class="mob-sub">Your InvoicePort account is ready. Let's create your first invoice.</p>
          <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#ffffff;color:#4f46e5;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,0.15);">Create My First Invoice →</a>
        </td>
      </tr>

      <!-- STATS BAR -->
      <tr>
        <td style="background:#4f46e5;padding:0 40px 24px;" class="mob-pad">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="stat-cell" width="32%" style="text-align:center;padding:14px 8px;background:rgba(255,255,255,0.12);border-radius:10px;">
                <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">90s</p>
                <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.5px;">Avg. invoice time</p>
              </td>
              <td class="stat-gap" width="2%"></td>
              <td class="stat-cell" width="32%" style="text-align:center;padding:14px 8px;background:rgba(255,255,255,0.12);border-radius:10px;">
                <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">10+</p>
                <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.5px;">Templates</p>
              </td>
              <td class="stat-gap" width="2%"></td>
              <td class="stat-cell" width="32%" style="text-align:center;padding:14px 8px;background:rgba(255,255,255,0.12);border-radius:10px;">
                <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">Free</p>
                <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.5px;">To get started</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 3 STEPS -->
      <tr>
        <td style="padding:32px 40px 8px;" class="mob-pad">
          <h3 style="margin:0 0 20px;font-size:18px;color:#1e293b;font-weight:700;">🚀 Up and running in 3 steps</h3>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td width="52" valign="top" style="padding-top:2px;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:10px;text-align:center;line-height:36px;font-size:16px;font-weight:800;color:#fff;">1</div>
              </td>
              <td valign="top" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
                <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1e293b;">Pick a template</p>
                <p style="margin:0;font-size:13px;color:#64748b;">10+ professional designs, ready to go.</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td width="52" valign="top" style="padding-top:2px;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:10px;text-align:center;line-height:36px;font-size:16px;font-weight:800;color:#fff;">2</div>
              </td>
              <td valign="top" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
                <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1e293b;">Add your details</p>
                <p style="margin:0;font-size:13px;color:#64748b;">Client, items, tax — done in seconds.</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="52" valign="top" style="padding-top:2px;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;text-align:center;line-height:36px;font-size:16px;font-weight:800;color:#fff;">3</div>
              </td>
              <td valign="top" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
                <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1e293b;">Send &amp; get paid</p>
                <p style="margin:0;font-size:13px;color:#64748b;">Email directly or download as PDF.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr>
        <td style="padding:28px 40px 0;"><div style="height:1px;background:#e2e8f0;"></div></td>
      </tr>

      <!-- PRO FEATURES -->
      <tr>
        <td style="padding:28px 40px 8px;" class="mob-pad">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;">Upgrade to Pro</p>
          <h3 style="margin:0 0 20px;font-size:18px;color:#1e293b;font-weight:700;">More power when you need it ⚡</h3>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="pro-cell" width="48%" valign="top" style="padding-right:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:10px;">
                  <tr><td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:18px;">📧</p>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1e293b;">Gmail Integration</p>
                    <p style="margin:0;font-size:12px;color:#64748b;">Send from your own inbox.</p>
                  </td></tr>
                </table>
              </td>
              <td class="pro-gap" width="4%"></td>
              <td class="pro-cell" width="48%" valign="top" style="padding-left:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:10px;">
                  <tr><td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:18px;">🎨</p>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1e293b;">Custom Branding</p>
                    <p style="margin:0;font-size:12px;color:#64748b;">Your logo &amp; colors, every invoice.</p>
                  </td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="pro-cell" width="48%" valign="top" style="padding-right:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:10px;">
                  <tr><td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:18px;">♾️</p>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1e293b;">Unlimited Invoices</p>
                    <p style="margin:0;font-size:12px;color:#64748b;">No caps, no limits.</p>
                  </td></tr>
                </table>
              </td>
              <td class="pro-gap" width="4%"></td>
              <td class="pro-cell" width="48%" valign="top" style="padding-left:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:10px;">
                  <tr><td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:18px;">📥</p>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1e293b;">Unlimited PDF Downloads</p>
                    <p style="margin:0;font-size:12px;color:#64748b;">Download anytime, no limits.</p>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- PRO CTA -->
      <tr>
        <td style="padding:0 40px 36px;" class="mob-pad">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1px solid #fcd34d;border-radius:12px;">
            <tr>
              <td style="padding:22px 28px;" align="center">
                <p style="margin:0 0 12px;font-size:14px;color:#92400e;font-weight:600;">Pay for the plan period. No auto-renewals, ever.</p>
                <a href="${SITE_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(245,158,11,0.35);">View Pro Plans →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;" class="mob-pad">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Questions? Reply to this email — we read every one.</p>
              <p style="margin:0 0 16px;font-size:13px;"><a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a></p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">© ${CURRENT_YEAR} InvoicePort. All rights reserved.</p>
            </td></tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>

</body>
</html>`;
}
