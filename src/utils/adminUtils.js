export const getAdminEmails = () =>
  (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export const isAdminEmail = (email) => getAdminEmails().includes(email);
