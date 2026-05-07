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
    body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    table { border-collapse: collapse; }
    .main-card { background-color: #ffffff; border: 1px solid #e1e8f0; border-radius: 12px; overflow: hidden; }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content { padding: 30px 20px !important; }
      .hero-h1 { font-size: 24px !important; }
      .feature-card { width: 100% !important; display: block !important; margin-bottom: 16px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="background-color: #f4f7fa; padding: 40px 0;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7fa;">
  <tr>
    <td align="center">
      <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; margin: 0 auto;">
        
        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <img src="${LOGO_URL}" width="48" height="48" alt="InvoicePort" style="border-radius: 10px;" />
          </td>
        </tr>

        <!-- MAIN CARD -->
        <tr>
          <td class="main-card" style="background-color: #ffffff; border: 1px solid #e1e8f0; border-radius: 12px; overflow: hidden;">
            
            <!-- HERO -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid #f0f4f8;">
              <tr>
                <td class="content" style="padding: 48px 40px; text-align: center;">
                  <h1 class="hero-h1" style="margin: 0 0 16px; color: #1a202c; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Welcome to InvoicePort, ${name}</h1>
                  <p style="margin: 0 0 32px; color: #4a5568; font-size: 16px; line-height: 1.6; max-width: 480px; margin-left: auto; margin-right: auto;">
                    We're excited to help you streamline your billing process. Your account is now active and ready for your first professional invoice.
                  </p>
                  <a href="${SITE_URL}/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">
                    Go to Dashboard
                  </a>
                </td>
              </tr>
            </table>

            <!-- STEPS -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="content" style="padding: 40px;">
                  <h2 style="margin: 0 0 24px; color: #1a202c; font-size: 18px; font-weight: 600;">Getting Started is Simple</h2>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <!-- Step 1 -->
                    <tr>
                      <td width="32" valign="top" style="padding-top: 4px;">
                        <div style="width: 24px; height: 24px; background-color: #eef2ff; border-radius: 50%; color: #4f46e5; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700;">1</div>
                      </td>
                      <td style="padding-left: 16px; padding-bottom: 24px;">
                        <div style="font-size: 15px; font-weight: 600; color: #2d3748; margin-bottom: 4px;">Customize Your Profile</div>
                        <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.5;">Add your business details and logo in settings to personalize your invoices.</p>
                      </td>
                    </tr>
                    <!-- Step 2 -->
                    <tr>
                      <td width="32" valign="top" style="padding-top: 4px;">
                        <div style="width: 24px; height: 24px; background-color: #eef2ff; border-radius: 50%; color: #4f46e5; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700;">2</div>
                      </td>
                      <td style="padding-left: 16px; padding-bottom: 24px;">
                        <div style="font-size: 15px; font-weight: 600; color: #2d3748; margin-bottom: 4px;">Create an Invoice</div>
                        <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.5;">Choose from our professional templates and fill in your client details.</p>
                      </td>
                    </tr>
                    <!-- Step 3 -->
                    <tr>
                      <td width="32" valign="top" style="padding-top: 4px;">
                        <div style="width: 24px; height: 24px; background-color: #eef2ff; border-radius: 50%; color: #4f46e5; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700;">3</div>
                      </td>
                      <td style="padding-left: 16px;">
                        <div style="font-size: 15px; font-weight: 600; color: #2d3748; margin-bottom: 4px;">Send and Get Paid</div>
                        <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.5;">Download your invoice as a PDF or send it directly to your client via email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- PRO SECTION -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-top: 1px solid #f0f4f8; border-bottom: 1px solid #f0f4f8;">
              <tr>
                <td class="content" style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; background-color: #eef2ff; padding: 4px 10px; border-radius: 4px;">Pro Advantage</span>
                    <h2 style="margin: 12px 0 0; color: #1a202c; font-size: 20px; font-weight: 600;">Take your billing to the next level</h2>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td class="feature-card" width="50%" valign="top" style="padding-right: 10px;">
                        <div style="background-color: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; padding: 20px; min-height: 120px;">
                          <div style="font-size: 18px; margin-bottom: 12px;">📥</div>
                          <div style="font-size: 14px; font-weight: 600; color: #2d3748; margin-bottom: 6px;">Unlimited PDF</div>
                          <p style="margin: 0; font-size: 12px; color: #718096; line-height: 1.5;">Download as many invoices as you need with no restrictions.</p>
                        </div>
                      </td>
                      <td class="feature-card" width="50%" valign="top" style="padding-left: 10px;">
                        <div style="background-color: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; padding: 20px; min-height: 120px;">
                          <div style="font-size: 18px; margin-bottom: 12px;">📧</div>
                          <div style="font-size: 14px; font-weight: 600; color: #2d3748; margin-bottom: 6px;">Gmail Sync</div>
                          <p style="margin: 0; font-size: 12px; color: #718096; line-height: 1.5;">Send invoices directly from your own Gmail account.</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="${SITE_URL}/subscription" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600;">
                      Explore Pro Plans &rarr;
                    </a>
                  </div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding: 32px 0;">
            <p style="margin: 0 0 12px; color: #718096; font-size: 13px; line-height: 1.5;">
              Need help? Reply to this email or visit our <a href="${SITE_URL}" style="color: #4f46e5; text-decoration: none;">Help Center</a>.
            </p>
            <p style="margin: 0; color: #a0aec0; font-size: 12px;">
              &copy; ${CURRENT_YEAR} InvoicePort. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}
