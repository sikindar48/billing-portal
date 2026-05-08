// ─── Email Request Types ──────────────────────────────────────────────────────

export interface BaseEmailRequest {
  type: 'welcome' | 'otp' | 'subscription_confirmation' | 'invoice';
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

export interface InvoiceEmailRequest extends BaseEmailRequest {
  type: 'invoice';
  user_name?: string;
  invoice_number: string;
  amount: string;
  currency: string;
  due_date: string;
  verify_url: string;
  attachment?: string; // Optional base64 string
}

export type EmailRequest = 
  | WelcomeEmailRequest 
  | OtpEmailRequest 
  | SubscriptionEmailRequest 
  | InvoiceEmailRequest;
