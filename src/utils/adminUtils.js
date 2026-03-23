// Admin email list — used ONLY for sending notification emails (e.g. payment alerts).
// NOT used for access control. Admin status is determined solely by the user_roles DB table.
export const getAdminEmails = () =>
  (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
