import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
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
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using InvoicePort ("Service," "Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              InvoicePort is a cloud-based invoice management platform that allows you to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li>Create and customize professional invoices</li>
              <li>Manage customers and products</li>
              <li>Send invoices via email</li>
              <li>Track invoice history and payments</li>
              <li>Integrate with Gmail (Pro plan)</li>
              <li>Generate QR codes for payment verification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <div className="space-y-3 text-gray-700">
              <p>To use InvoicePort, you must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Subscription Plans</h2>
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.1 Free Trial</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Limited to 5 invoices</li>
                  <li>Basic email delivery via EmailJS</li>
                  <li>Standard invoice templates</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.2 Pro Plan</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Unlimited invoices</li>
                  <li>Gmail integration (send from your own email)</li>
                  <li>Custom branding and templates</li>
                  <li>Customer and product management</li>
                  <li>Priority support</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4.3 Payment Terms</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Subscriptions are billed monthly or yearly in advance</li>
                  <li>Payments are processed securely through Razorpay</li>
                  <li>All fees are in Indian Rupees (INR) unless otherwise stated</li>
                  <li>Prices are subject to change with 30 days notice</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We offer a 7-day money-back guarantee for new Pro subscriptions. To request a refund, contact us at info.invoiceport@gmail.com within 7 days of your initial purchase. Refunds are not available for renewals or after the 7-day period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Cancellation</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              You may cancel your subscription at any time from your account settings. Upon cancellation:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li>You will retain access until the end of your current billing period</li>
              <li>No refunds will be provided for partial months</li>
              <li>Your account will revert to the Free Trial plan</li>
              <li>Your data will be retained for 30 days in case you wish to reactivate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Acceptable Use</h2>
            <p className="text-gray-700 mb-2">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Send spam or unsolicited emails through our platform</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or viruses</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Impersonate others or provide false information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Gmail Integration</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <p className="text-blue-900 font-semibold mb-2">Important Notice</p>
              <p className="text-blue-800 text-sm">
                When you connect your Gmail account, you grant InvoicePort permission to send emails on your behalf. We will only send emails that you explicitly create and authorize through our platform.
              </p>
            </div>
            <p className="text-gray-700 mb-2">By connecting Gmail, you acknowledge that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li>You authorize us to send invoices from your Gmail address</li>
              <li>You are responsible for the content of emails sent</li>
              <li>You can disconnect Gmail at any time from settings</li>
              <li>We comply with Google's API Services User Data Policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Intellectual Property</h2>
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">9.1 Our Rights</h3>
                <p>
                  InvoicePort and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">9.2 Your Content</h3>
                <p>
                  You retain all rights to the content you create (invoices, customer data, branding). By using our Service, you grant us a license to store, process, and display your content solely to provide the Service.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Data and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of InvoicePort is also governed by our{' '}
              <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              . We are committed to protecting your data and complying with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2 text-gray-700">
              <p className="font-semibold text-gray-900">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
              <p>We do not guarantee that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The Service will be uninterrupted or error-free</li>
                <li>Defects will be corrected</li>
                <li>The Service is free of viruses or harmful components</li>
                <li>Results obtained will be accurate or reliable</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, InvoicePort shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless InvoicePort from any claims, damages, losses, or expenses arising from your use of the Service, violation of these Terms, or infringement of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We may terminate or suspend your account immediately, without prior notice, if you:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li>Violate these Terms</li>
              <li>Engage in fraudulent activity</li>
              <li>Fail to pay subscription fees</li>
              <li>Use the Service in a way that harms us or others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or through the platform. Your continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">16. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">17. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-gray-700">
              <p><strong>Email:</strong> info.invoiceport@gmail.com</p>
            </div>
          </section>

          <section className="border-t pt-6">
            <p className="text-sm text-gray-500 italic">
              By using InvoicePort, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
