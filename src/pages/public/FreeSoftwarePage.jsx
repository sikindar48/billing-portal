import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Star, Users, Zap, Shield, BarChart3, Globe } from 'lucide-react';

const FreeSoftwarePage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <Zap className="w-5 h-5" />, title: "3-Day Free Trial", desc: "No credit card required. No hidden fees. Try all premium features for 3 days." },
    { icon: <Shield className="w-5 h-5" />, title: "Bank-Grade Security", desc: "Enterprise encryption protects your financial data and client information." },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Real-Time Analytics", desc: "Track revenue, outstanding payments, and business growth instantly." },
    { icon: <Globe className="w-5 h-5" />, title: "Multi-Currency", desc: "Invoice in INR, USD, EUR with automatic currency conversion." },
    { icon: <Users className="w-5 h-5" />, title: "Client Management", desc: "Store unlimited client profiles and manage all your business relationships." },
    { icon: <CheckCircle2 className="w-5 h-5" />, title: "GST Compliant", desc: "Automatic GST, IGST, CGST+SGST calculations for Indian businesses." },
  ];

  const faqs = [
    {
      q: "Does Invoice Port offer a free trial?",
      a: "Yes. We offer a 3-Day Free Trial that allows you to create up to 10 invoices, download up to 5 PDFs, and try basic templates. No credit card is required to sign up."
    },
    {
      q: "What happens after the trial ends?",
      a: "After your 3-day trial, you can upgrade to one of our premium plans (Pro Monthly or Pro Yearly) to keep generating unlimited invoices and retainers."
    },
    {
      q: "Can I use Invoice Port for my small business?",
      a: "Absolutely. Invoice Port is designed for freelancers, small businesses, and startups. Scale from 1 client to 1000+ without changing tools."
    },
    {
      q: "Do you charge transaction fees like Wave or PayPal?",
      a: "No. We don't charge any processing fees. You keep 100% of your payments."
    },
    {
      q: "Can I export invoices as PDF?",
      a: "Yes. All invoices can be downloaded as PDF, emailed directly to clients, or shared via link."
    },
    {
      q: "Is my data secure?",
      a: "Yes. We use enterprise-grade encryption, regular security audits, and comply with data protection regulations."
    }
  ];

  return (
    <>
      <SEO
        title="Free Invoicing Software & GST Invoice Generator | Invoice Port"
        description="Create professional invoices instantly with Invoice Port's free invoicing software. GST calculations, customizable templates, client registers & PDF export. Try it free today!"
        keywords="free invoicing software, free invoice software, GST invoice software free, online invoicing software, free invoice generator India"
        canonicalUrl="/free-invoicing-software"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": features.map(f => ({
            "@type": "Question",
            "name": f.title,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.desc
            }
          }))
        }}
      />

      <div className="min-h-screen bg-[#0B0F19] text-white">
        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-xl font-bold tracking-tight hover:text-indigo-400 transition-colors">
            InvoicePort
          </button>
          <Button onClick={() => navigate('/')} variant="ghost" className="text-white hover:bg-white/10">
            Back to Home
          </Button>
        </nav>

        {/* Hero */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            3-Day Free Trial
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Free Invoicing Software
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              No Credit Card Required
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Try our high-fidelity invoicing suite. Create up to 10 invoices, download PDFs, and manage clients. No credit card required to start.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => navigate('/')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-6 rounded-xl text-lg"
            >
              Start Free Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-xl text-lg"
            >
              Learn More
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              10 Invoices Limit
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3 Days Full Access
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              PDF export
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Email delivery
            </div>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose Invoice Port?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 transition-all">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 text-indigo-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 mb-20">
            <h3 className="text-2xl font-bold mb-8 text-center">How We Compare</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold">Invoice Port</th>
                    <th className="text-center py-3 px-4 font-semibold">Wave</th>
                    <th className="text-center py-3 px-4 font-semibold">Zoho</th>
                    <th className="text-center py-3 px-4 font-semibold">FreshBooks</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Free Trial", port: "✓ (3 Days)", wave: "✓", zoho: "✓", fresh: "✗" },
                    { feature: "No Credit Card", port: "✓", wave: "✓", zoho: "✗", fresh: "✗" },
                    { feature: "Processing Fees", port: "None", wave: "2.9%+$0.60", zoho: "None", fresh: "N/A" },
                    { feature: "Unlimited Invoices", port: "Pro Only", wave: "✓", zoho: "✓", fresh: "✗" },
                    { feature: "Professional Templates", port: "10", wave: "5", zoho: "8", fresh: "6" },
                    { feature: "GST Support", port: "✓", wave: "✗", zoho: "✓", fresh: "✗" },
                    { feature: "Email Integration", port: "✓", wave: "✓", zoho: "✓", fresh: "✓" },
                    { feature: "Client Portal", port: "✓", wave: "✗", zoho: "✓", fresh: "✓" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">{row.feature}</td>
                      <td className="text-center py-3 px-4 text-emerald-400 font-semibold">{row.port}</td>
                      <td className="text-center py-3 px-4 text-slate-400">{row.wave}</td>
                      <td className="text-center py-3 px-4 text-slate-400">{row.zoho}</td>
                      <td className="text-center py-3 px-4 text-slate-400">{row.fresh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <details key={i} className="group p-6 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 transition-all cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-lg">
                  {faq.q}
                  <span className="text-indigo-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-slate-400 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Invoicing?</h2>
            <p className="text-slate-300 mb-8 text-lg">Join thousands of freelancers and small businesses using Invoice Port.</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-6 rounded-xl text-lg"
            >
              Start Free Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 mt-20 py-12">
          <div className="max-w-6xl mx-auto px-6 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Invoice Port. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default FreeSoftwarePage;
