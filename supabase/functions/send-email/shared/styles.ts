// ─── Shared Email CSS Styles ──────────────────────────────────────────────────

export const baseStyles = `
  @media only screen and (max-width: 600px) {
    .mobile-padding { padding: 20px !important; }
    .mobile-text    { font-size: 14px !important; }
    .mobile-title   { font-size: 24px !important; line-height: 1.2 !important; }
    .mobile-subtitle{ font-size: 14px !important; }
  }
`;

export const welcomeStyles = `
  ${baseStyles}
  @media only screen and (max-width: 600px) {
    .mobile-step-title { font-size: 15px !important; }
    .mobile-step-desc  { font-size: 13px !important; }
    .feat-cell { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; }
    .feat-spacer { display: none !important; }
  }
`;

export const otpStyles = `
  ${baseStyles}
  @media only screen and (max-width: 600px) {
    .mobile-otp { font-size: 40px !important; letter-spacing: 8px !important; }
  }
`;

export const subscriptionStyles = `
  ${baseStyles}
  @media only screen and (max-width: 600px) {
    .mobile-title { font-size: 26px !important; }
    .sub-table td { padding: 10px 0 !important; font-size: 14px !important; }
  }
`;
