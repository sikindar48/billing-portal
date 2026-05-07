import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to InvoicePort ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our invoice management platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Account information (name, email address, password)</li>
                  <li>Business information (company name, logo, address)</li>
                  <li>Customer information (names, email addresses, billing details)</li>
                  <li>Invoice data (products, services, amounts, payment terms)</li>
                  <li>Payment information (processed securely through Razorpay)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.2 Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.3 Gmail Integration (Pro Users)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Gmail email address</li>
                  <li>OAuth access tokens (encrypted and stored securely)</li>
                  <li>Email sending permissions (only used to send invoices you create)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-2">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li>Provide and maintain our invoice management services</li>
              <li>Process your subscription payments</li>
              <li>Send invoices to your customers via email</li>
              <li>Customize your invoice templates with your branding</li>
              <li>Provide customer support and respond to your inquiries</li>
              <li>Send important service updates and notifications</li>
              <li>Improve our platform and develop new features</li>
              <li>Detect and prevent fraud or unauthorized access</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Gmail API Usage</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <p className="text-blue-900 font-semibold mb-2">Limited Use Disclosure</p>
              <p className="text-blue-800 text-sm">
                InvoicePort's use of information received from Gmail APIs adheres to{' '}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </div>
            <p className="text-gray-700 mb-2">When you connect your Gmail account (Pro feature):</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li><strong>We only request permission to send emails</strong> - we cannot read your existing emails</li>
              <li><strong>We only send emails you explicitly create</strong> - we never send emails without your action</li>
              <li><strong>Your Gmail credentials are never stored</strong> - we use secure OAuth tokens</li>
              <li><strong>You can disconnect Gmail anytime</strong> - from your branding settings</li>
              <li><strong>We do not share your Gmail data</strong> with any third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-2">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li><strong>Service Providers:</strong> Supabase (database), Razorpay (payments), EmailJS (email delivery for free users)</li>
              <li><strong>Your Customers:</strong> When you send them invoices</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700 mt-2">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Secure OAuth 2.0 for Gmail integration</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-700 mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Disconnect Gmail integration at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to improve your experience, analyze usage, and remember your preferences. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for users under 18 years of age. We do not knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through our platform. Your continued use of InvoicePort after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-gray-700">
              <p><strong>Email:</strong> info.invoiceport@gmail.com</p>
            </div>
          </section>

          <section className="border-t pt-6">
            <p className="text-sm text-gray-500 italic">
              By using InvoicePort, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
