// ─── Welcome Email Template ───────────────────────────────────────────────────

import { SITE_URL, LOGO_URL, SUPPORT_EMAIL, CURRENT_YEAR } from '../shared/utils.ts';

export function welcomeEmailHtml(userName: string): string {
  const name = userName || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Welcome to InvoicePort</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      width: 100% !important; 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
      background-color: #f6f9fc;
    }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 32px 20px !important; }
      .feature-col { width: 100% !important; display: block !important; padding: 0 !important; margin-bottom: 20px !important; }
      .hero-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f9fc;">
  <tr>
    <td align="center" style="padding: 40px 10px;">
      
      <!-- HEADER -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width: 600px;">
        <tr>
          <td align="center" style="padding-bottom: 32px;">
            <img src="${LOGO_URL}" width="56" height="56" alt="InvoicePort" style="display: block; border-radius: 12px;" />
          </td>
        </tr>
      </table>

      <!-- MAIN CONTENT -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e6ebf1; overflow: hidden;">
        
        <!-- HERO -->
        <tr>
          <td class="content" align="center" style="padding: 56px 48px; border-bottom: 1px solid #f0f4f8;">
            <h1 class="hero-title" style="margin: 0 0 16px; color: #1e293b; font-size: 30px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em;">Welcome to InvoicePort! 🎉</h1>
            <p style="margin: 0 0 32px; color: #64748b; font-size: 16px; line-height: 1.6; max-width: 440px;">
              Hi ${name}, we're thrilled to have you on board. Your account is ready — let's start making your billing effortless.
            </p>
            <a href="${SITE_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 700; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.25);">
              Create Your First Invoice
            </a>
          </td>
        </tr>

        <!-- FEATURES -->
        <tr>
          <td class="content" style="padding: 48px;">
            <h2 style="margin: 0 0 32px; color: #1e293b; font-size: 18px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">Everything you need to succeed</h2>
            
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="feature-col" width="50%" valign="top" style="padding-right: 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 12px; padding: 24px; height: 100%;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 28px; margin-bottom: 12px;">🎨</div>
                        <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Premium UI</div>
                        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">Choose from 12+ high-fidelity templates designed for modern brands.</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="feature-col" width="50%" valign="top" style="padding-left: 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 12px; padding: 24px; height: 100%;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 28px; margin-bottom: 12px;">📧</div>
                        <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Gmail Sync</div>
                        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">Connect your own inbox and send invoices directly to your clients.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <!-- BOTTOM FOOTER -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width: 600px; padding-top: 32px;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 12px; font-size: 14px; color: #94a3b8;">
              Questions? Reply to this email or visit our <a href="${SITE_URL}" style="color: #6366f1; text-decoration: none; font-weight: 600;">Help Center</a>.
            </p>
            <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
              © ${CURRENT_YEAR} InvoicePort. All rights reserved.
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
