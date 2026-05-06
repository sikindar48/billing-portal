// ─── Email Request Types ──────────────────────────────────────────────────────

export interface BaseEmailRequest {
  type: 'welcome' | 'otp' | 'subscription_confirmation';
  to: string | string[];
}

export interface WelcomeEmailRequest extends BaseEmailRequest {
  type: 'welcome';
  user_name?: string;
}

export interface OtpEmailRequest extends BaseEmailRequest {
  type: 'otp';
  otp_code: string;
  purpose?: 'password_reset';
  expires_in?: string;
}

export interface SubscriptionEmailRequest extends BaseEmailRequest {
  type: 'subscription_confirmation';
  user_name?: string;
  plan_name: string;
  amount: number;
  billing_cycle: string;
  period_end: string;
}

export type EmailRequest = WelcomeEmailRequest | OtpEmailRequest | SubscriptionEmailRequest;
