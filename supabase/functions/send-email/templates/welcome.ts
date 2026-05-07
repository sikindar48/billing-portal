// ─── Welcome Email Template ───────────────────────────────────────────────────

import { SITE_URL, LOGO_URL, SUPPORT_EMAIL, CURRENT_YEAR } from '../shared/utils.ts';

export function welcomeEmailHtml(userName: string): string {
  const name = userName || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to InvoicePort</title>
  <style>
    /* RESET STYLES */
    body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important; background-color: #f8fafc; }
    table { border-spacing: 0; border-collapse: collapse; table-layout: fixed; margin: 0 auto; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding-left: 10px !important; padding-right: 10px !important; }
      .content-wrap { padding: 30px 20px !important; }
      .hero-title { font-size: 28px !important; line-height: 1.2 !important; }
      .hero-sub { font-size: 15px !important; }
      .stat-item { width: 100% !important; display: block !important; margin-bottom: 12px !important; }
      .stat-spacer { display: none !important; }
      .step-icon-col { width: 44px !important; }
      .step-text-col { padding-left: 12px !important; }
      .pro-card { width: 100% !important; display: block !important; padding-right: 0 !important; padding-left: 0 !important; margin-bottom: 15px !important; }
      .pro-spacer { display: none !important; }
      .btn-primary { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 40px 0;">
  <tr>
    <td align="center">
      <!-- MAIN CONTAINER -->
      <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #eef2f6;">
        
        <!-- HERO SECTION -->
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 60px 40px 40px;" class="content-wrap">
            <img src="${LOGO_URL}" width="72" height="72" alt="InvoicePort" style="display: block; margin: 0 auto 24px; border-radius: 18px; box-shadow: 0 10px 20px rgba(0,0,0,0.2);" />
            <h1 class="hero-title" style="margin: 0 0 12px; color: #ffffff; font-size: 36px; font-weight: 800; text-align: center; letter-spacing: -0.02em;">Welcome to the family! 🎉</h1>
            <p class="hero-sub" style="margin: 0 0 32px; color: rgba(255,255,255,0.9); font-size: 17px; line-height: 1.6; text-align: center; max-width: 440px; margin-left: auto; margin-right: auto;">
              Hi ${name}, your InvoicePort account is ready. Let's make your billing process as smooth as silk.
            </p>
            <div align="center">
              <a href="${SITE_URL}/dashboard" class="btn-primary" style="display: inline-block; background-color: #ffffff; color: #6366f1; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: transform 0.2s ease;">Create Your First Invoice</a>
            </div>
          </td>
        </tr>

        <!-- STATS / HIGHLIGHTS -->
        <tr>
          <td style="background-color: #4f46e5; padding: 0 40px 30px;" class="content-wrap">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="stat-item" width="31%" align="center" style="background: rgba(255,255,255,0.1); border-radius: 14px; padding: 18px 10px;">
                  <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">&lt; 2 min</div>
                  <div style="font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">To generate</div>
                </td>
                <td class="stat-spacer" width="3.5%"></td>
                <td class="stat-item" width="31%" align="center" style="background: rgba(255,255,255,0.1); border-radius: 14px; padding: 18px 10px;">
                  <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">12+</div>
                  <div style="font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Premium UI</div>
                </td>
                <td class="stat-spacer" width="3.5%"></td>
                <td class="stat-item" width="31%" align="center" style="background: rgba(255,255,255,0.1); border-radius: 14px; padding: 18px 10px;">
                  <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">₹0</div>
                  <div style="font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">To Start</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- HOW IT WORKS -->
        <tr>
          <td style="padding: 48px 40px 24px;" class="content-wrap">
            <h2 style="margin: 0 0 28px; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.01em;">Quick Start Guide 🚀</h2>
            
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
              <tr>
                <td class="step-icon-col" width="56" valign="top">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 12px; color: #6366f1; text-align: center; line-height: 40px; font-weight: 800; font-size: 16px; border: 1px solid #c7d2fe;">1</div>
                </td>
                <td class="step-text-col" style="padding-left: 20px; padding-bottom: 24px;">
                  <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Choose your vibe</div>
                  <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">Pick from our curated list of professional, high-fidelity invoice templates.</p>
                </td>
              </tr>
              <tr>
                <td class="step-icon-col" valign="top">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; color: #8b5cf6; text-align: center; line-height: 40px; font-weight: 800; font-size: 16px; border: 1px solid #ddd6fe;">2</div>
                </td>
                <td class="step-text-col" style="padding-left: 20px; padding-bottom: 24px;">
                  <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Fill in the blanks</div>
                  <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">Our smart editor helps you add items, clients, and taxes in record time.</p>
                </td>
              </tr>
              <tr>
                <td class="step-icon-col" valign="top">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; color: #10b981; text-align: center; line-height: 40px; font-weight: 800; font-size: 16px; border: 1px solid #a7f3d0;">3</div>
                </td>
                <td class="step-text-col" style="padding-left: 20px;">
                  <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Send & Get Paid</div>
                  <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">Download as a premium PDF or send directly via email to your clients.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="padding: 0 40px;"><div style="height: 1px; background-color: #f1f5f9;"></div></td>
        </tr>

        <!-- PRO FEATURES -->
        <tr>
          <td style="padding: 40px 40px 10px;" class="content-wrap">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="background-color: #fffbeb; color: #d97706; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 20px; border: 1px solid #fef3c7;">Pro Features</span>
              <h2 style="margin: 12px 0 0; color: #0f172a; font-size: 20px; font-weight: 800;">Scale your business ⚡</h2>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="pro-card" width="48%" style="padding-bottom: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; padding: 20px;">
                    <tr>
                      <td>
                        <div style="font-size: 24px; margin-bottom: 12px;">📧</div>
                        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Gmail Sync</div>
                        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">Send invoices from your own professional domain.</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="pro-spacer" width="4%"></td>
                <td class="pro-card" width="48%" style="padding-bottom: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; padding: 20px;">
                    <tr>
                      <td>
                        <div style="font-size: 24px; margin-bottom: 12px;">🎨</div>
                        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Custom Brand</div>
                        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">Your logo, your colors, your rules. Zero InvoicePort ads.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="pro-card" width="48%" style="padding-bottom: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; padding: 20px;">
                    <tr>
                      <td>
                        <div style="font-size: 24px; margin-bottom: 12px;">♾️</div>
                        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Unlimited</div>
                        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">No limits on invoices, downloads, or templates.</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="pro-spacer" width="4%"></td>
                <td class="pro-card" width="48%" style="padding-bottom: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; padding: 20px;">
                    <tr>
                      <td>
                        <div style="font-size: 24px; margin-bottom: 12px;">🛠️</div>
                        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Smart Tools</div>
                        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">Advanced analytics and bulk invoice generation.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SUBSCRIPTION CTA -->
        <tr>
          <td style="padding: 20px 40px 60px;" class="content-wrap">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fcd34d; border-radius: 20px; padding: 30px 24px; text-align: center;">
              <tr>
                <td>
                  <p style="margin: 0 0 16px; color: #92400e; font-size: 14px; font-weight: 600; line-height: 1.5;">Professional billing without the monthly headache. No auto-renewals, just pure value.</p>
                  <a href="${SITE_URL}/subscription" style="display: inline-block; background: linear-gradient(to right, #d97706, #f59e0b); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 8px 16px rgba(217,119,6,0.2);">Upgrade to Pro</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color: #f8fafc; padding: 40px; border-top: 1px solid #f1f5f9;" class="content-wrap">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <div style="margin-bottom: 20px;">
                    <a href="${SITE_URL}" style="text-decoration: none; color: #6366f1; font-weight: 700; font-size: 14px;">InvoicePort</a>
                    <span style="color: #cbd5e1; margin: 0 10px;">•</span>
                    <a href="mailto:${SUPPORT_EMAIL}" style="text-decoration: none; color: #6366f1; font-weight: 700; font-size: 14px;">Support</a>
                  </div>
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; line-height: 1.5;">Questions? Just reply to this email. We read every message.</p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${CURRENT_YEAR} InvoicePort. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

