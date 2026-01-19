// Example of how to use the new user-specific email service

import { sendInvoiceEmail, sendPaymentReminderEmail, sendPaymentReceivedEmail } from './userEmailService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Example: Send invoice email with user's branding
 */
export const sendUserInvoice = async (invoiceData) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare invoice data
    const invoice = {
      invoiceNumber: 'INV-001',
      date: '2025-01-06',
      dueDate: '2025-02-05',
      clientName: 'John Doe',
      totalAmount: '₹25,000',
      items: [
        { description: 'Web Development', quantity: 1, rate: 20000, amount: 20000 },
        { description: 'SEO Optimization', quantity: 1, rate: 5000, amount: 5000 }
      ],
      notes: 'Thank you for your business!',
      terms: 'Payment due within 30 days'
    };

    // Send email with user's branding
    const result = await sendInvoiceEmail(
      invoice,
      'client@example.com', // Client's email
      user.id // User ID for branding
    );

    if (result.success) {
      console.log('Invoice email sent successfully!');
      return { success: true };
    } else {
      console.error('Failed to send invoice email:', result.error);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('Error sending invoice:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Example: Send payment reminder with user's branding
 */
export const sendUserPaymentReminder = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const overdueInvoice = {
      invoiceNumber: 'INV-001',
      clientName: 'John Doe',
      dueDate: '2024-12-05',
      daysOverdue: 32,
      totalAmount: '₹25,000'
    };

    const result = await sendPaymentReminderEmail(
      overdueInvoice,
      'client@example.com',
      user.id,
      'gentle' // reminder type: gentle, firm, final
    );

    return result;
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Example: Send payment received confirmation with user's branding
 */
export const sendUserPaymentConfirmation = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const paymentData = {
      invoiceNumber: 'INV-001',
      clientName: 'John Doe',
      amount: '₹25,000',
      date: '2025-01-06',
      method: 'UPI Transfer'
    };

    const result = await sendPaymentReceivedEmail(
      paymentData,
      'client@example.com',
      user.id
    );

    return result;
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Key Benefits of the New System:
 * 
 * 1. MULTI-TENANT BRANDING:
 *    - Each user has their own company name, logo, colors
 *    - Clients see the user's business info, not "InvoicePort"
 *    - Professional, white-label experience
 * 
 * 2. USER-SPECIFIC EMAIL SETTINGS:
 *    - Custom email signatures and footers
 *    - User's contact information in emails
 *    - Personalized payment instructions
 * 
 * 3. BUSINESS INFORMATION:
 *    - Company address, phone, website
 *    - Bank details and UPI information
 *    - Tax rates and invoice numbering
 * 
 * 4. SCALABLE ARCHITECTURE:
 *    - Each user's data is isolated
 *    - Easy to add new branding features
 *    - Supports unlimited users
 * 
 * BEFORE (Problem):
 * - All emails showed "InvoicePort" branding
 * - Same company info for all users
 * - Not professional for business users
 * 
 * AFTER (Solution):
 * - Each user's emails show THEIR branding
 * - Personalized business information
 * - Professional, white-label experience
 * - Clients never see "InvoicePort" name
 */