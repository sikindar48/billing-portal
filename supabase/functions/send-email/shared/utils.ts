// ─── Shared Utility Functions ─────────────────────────────────────────────────

export const LOGO_URL =
  'https://twfoqvxlhxhdulqchjbq.supabase.co/storage/v1/object/public/icon/invoice_logo.webp';

export const SITE_URL = 'https://invoiceport.live';

export const SUPPORT_EMAIL = 'info@invoiceport.live';

export const CURRENT_YEAR = new Date().getFullYear();

export function formatIndianCurrency(amount: number): string {
  return amount.toLocaleString('en-IN');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
