// ─── Reusable HTML Components ─────────────────────────────────────────────────

import { CURRENT_YEAR, SITE_URL, SUPPORT_EMAIL } from './utils.ts';

/** Outer page wrapper — centers the card on a light background */
export function pageWrapper(content: string): string {
  return `
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">
        ${content}
      </td>
    </tr>
  </table>
</body>`;
}

/** White card container */
export function emailCard(content: string, maxWidth = 600): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:${maxWidth}px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  ${content}
</table>`;
}

/** Gradient header banner */
export function headerBanner(opts: {
  emoji: string;
  title: string;
  subtitle?: string;
  gradient?: string;
}): string {
  const gradient = opts.gradient ?? 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)';
  return `
<tr>
  <td style="background:${gradient};padding:40px 30px;text-align:center;" class="mobile-padding">
    <div style="font-size:48px;margin-bottom:16px;">${opts.emoji}</div>
    <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:-0.5px;" class="mobile-title">${opts.title}</h1>
    ${opts.subtitle ? `<p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:16px;font-weight:400;" class="mobile-subtitle">${opts.subtitle}</p>` : ''}
  </td>
</tr>`;
}

/** Standard footer with support link and copyright */
export function emailFooter(helpText = 'Need help? We\'re here for you!'): string {
  return `
<tr>
  <td style="background:#f8fafc;padding:24px 30px;border-top:1px solid #e2e8f0;" class="mobile-padding">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <p style="margin:0 0 12px;font-size:13px;color:#64748b;font-weight:500;">${helpText}</p>
          <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:500;margin-bottom:16px;">Contact Support</a>
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
            © ${CURRENT_YEAR} InvoicePort. All rights reserved.<br/>
            Professional Invoice Management Made Simple
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

/** Primary CTA button row */
export function ctaButton(opts: {
  href: string;
  label: string;
  subtext?: string;
  color?: string;
}): string {
  const color = opts.color ?? 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)';
  return `
<tr>
  <td style="padding:0 30px 32px;text-align:center;" class="mobile-padding">
    <a href="${opts.href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;box-shadow:0 4px 16px rgba(79,70,229,0.3);">
      ${opts.label}
    </a>
    ${opts.subtext ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;">${opts.subtext}</p>` : ''}
  </td>
</tr>`;
}

/** A single numbered step card (table-safe, no flexbox) */
export function stepCard(opts: {
  number: string;
  color: string;
  title: string;
  description: string;
  marginBottom?: string;
}): string {
  const mb = opts.marginBottom ?? '12px';
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:${mb};">
  <tr>
    <td style="padding:20px;" valign="top">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50" valign="top" style="padding-right:16px;">
            <div style="background:${opts.color};color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:16px;">${opts.number}</div>
          </td>
          <td valign="top">
            <h4 style="margin:0 0 6px;font-size:16px;color:#1e293b;font-weight:600;" class="mobile-step-title">${opts.title}</h4>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.5;" class="mobile-step-desc">${opts.description}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}
