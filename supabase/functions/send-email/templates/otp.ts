// ─── Password Reset Email Template ────────────────────────────────────────────

import { otpStyles } from '../shared/styles';
import { pageWrapper, emailCard } from '../shared/components';
import { SUPPORT_EMAIL, CURRENT_YEAR } from '../shared/utils';

export function otpEmailHtml(otpCode: string, expiresIn: string): string {
  const body = emailCard(`
    <!-- Header – red theme for password reset -->
    <tr>
      <td style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:40px 30px;text-align:center;" class="mobile-padding">
        <div style="background:rgba(255,255,255,0.15);width:72px;height:72px;border-radius:50%;margin:0 auto 16px;text-align:center;line-height:72px;">
          <span style="font-size:36px;">🔐</span>
        </div>
        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;" class="mobile-title">InvoicePort</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Password Reset</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px 30px;" class="mobile-padding">
        <h2 style="margin:0 0 12px;font-size:20px;color:#1e293b;font-weight:600;">Hello there! 👋</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;" class="mobile-text">
          You requested a password reset for your InvoicePort account. Use the code below to set a new password.
        </p>

        <!-- OTP Box – red theme -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef2f2 0%,#fecaca 100%);border:3px solid #dc2626;border-radius:16px;margin:0 0 20px;box-shadow:0 4px 12px rgba(220,38,38,0.15);">
          <tr>
            <td style="padding:32px 20px;" align="center">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;color:#dc2626;text-transform:uppercase;">🔐 Reset Code</p>
              <p style="margin:16px 0;font-size:48px;font-weight:900;letter-spacing:12px;color:#b91c1c;font-family:'Courier New',monospace;text-shadow:0 2px 4px rgba(185,28,28,0.1);" class="mobile-otp">${otpCode}</p>
              <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600;background:rgba(220,38,38,0.1);padding:6px 12px;border-radius:20px;display:inline-block;">Valid for ${expiresIn}</p>
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-left:3px solid #dc2626;border-radius:6px;margin-bottom:20px;">
          <tr>
            <td style="padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.5;" class="mobile-text">
                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. InvoicePort staff will never ask for your reset code.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;" class="mobile-text">
          If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;padding:24px 30px;border-top:1px solid #e2e8f0;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <p style="margin:0 0 12px;font-size:13px;color:#64748b;font-weight:500;">Need help? We're here for you!</p>
              <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:500;margin-bottom:16px;">Contact Support</a>
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                © ${CURRENT_YEAR} InvoicePort. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `, 500);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset – InvoicePort</title>
  <style>${otpStyles}</style>
</head>
${pageWrapper(body)}
</html>`;
}
