import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PublicFooter from '@/components/PublicFooter';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const PricingPage = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "Do you offer a free plan?",
      a: "We offer a 3-Day Free Trial that gives you full access to starter features: up to 10 invoices, 5 PDF downloads, and basic templates. After the 3 days, you can choose to upgrade to one of our paid plans to continue invoicing."
    },
    {
      q: "What's the difference between free and pro plans?",
      a: "The free plan covers all basics but has limits on invoice count. Pro plans unlock unlimited invoices, unlimited downloads, priority support, custom domain/branding, and integration options."
    },
    {
      q: "Can I cancel my subscription at any time?",
      a: "Yes, you can cancel your subscription from your settings dashboard at any time. You will continue to have access to your paid features until the end of your billing cycle."
    },
    {
      q: "Do you charge transaction fees on payments?",
      a: "No. We don't charge any transaction fees. You collect payments directly from your customers through your preferred payment methods."
    },
    {
      q: "Can I export invoices as PDF?",
      a: "Yes. All invoices can be instantly downloaded as high-quality PDFs or shared directly with clients via secure email links."
    }
  ];

  return (
    <>
      <SEO 
        title="Pricing - Simple & Transparent Plans | Invoice Port"
        description="Choose the plan that fits your business: Starter free plan, Pro Monthly, or Pro Yearly. No hidden fees. Cancel anytime."
        keywords="invoice software pricing, free billing plans, cheap invoice generator, premium invoicing"
        canonicalUrl="/pricing"
      />
      <div className="min-h-screen bg-[#0B0F19] text-white font-sans overflow-x-hidden flex flex-col justify-between">
        
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Header */}
        <Navbar />

        {/* Hero Section */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Simple, transparent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              pricing options.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Start free with our 3-day trial. Upgrade as your business grows. No hidden fees or charges.
          </p>
        </section>

        {/* Pricing Grid */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* FREE TRIAL TIER */}
            <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col hover:border-white/10 transition-all justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-blue-400 font-bold text-sm uppercase tracking-wider">Free Trial</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold text-white">₹0</span>
                    <span className="text-slate-500 ml-2">/3 days</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">Perfect to evaluate our platform layout.</p>
                </div>
                <ul className="space-y-4">
                  {['10 Invoices Limit', '3 Days Full Access', '5 Downloads Limit', 'Basic Templates'].map(f => (
                    <li key={f} className="flex gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-6 mt-8 font-semibold"
              >
                Start 3-Day Trial
              </Button>
            </div>

            {/* PRO MONTHLY */}
            <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col hover:border-white/10 transition-all justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-indigo-400 font-bold text-sm uppercase tracking-wider">Pro Monthly</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold text-white">₹149</span>
                    <span className="text-slate-400 ml-2">/month</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">For freelancers & growing businesses.</p>
                </div>
                <ul className="space-y-4">
                  {['Unlimited Invoices', 'Unlimited Downloads', 'Email Integration', 'Priority Support', 'Custom Branding'].map(f => (
                    <li key={f} className="flex gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 rounded-xl py-6 mt-8"
              >
                Get Started
              </Button>
            </div>

            {/* PRO YEARLY */}
            <div className="p-8 rounded-3xl border border-indigo-500/50 bg-slate-800/60 shadow-2xl shadow-indigo-500/10 relative flex flex-col scale-105 z-10 justify-between">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-indigo-500/50">Best Value</div>
              
              <div className="space-y-6 mt-4">
                <div>
                  <span className="text-indigo-400 font-bold text-sm uppercase tracking-wider">Pro Yearly</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-5xl font-bold text-white">₹1499</span>
                    <span className="text-slate-400 ml-2">/year</span>
                  </div>
                  <p className="text-indigo-100/80 text-sm mt-4">Best value for committed users.</p>
                  <span className="inline-block mt-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                    Save ₹289/year
                  </span>
                </div>
                <ul className="space-y-4">
                  {['Unlimited Invoices', 'Unlimited Downloads', 'Email Integration', 'Priority Support', 'Custom Branding'].map(f => (
                    <li key={f} className="flex gap-3 text-sm text-white">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/25 rounded-xl py-6 mt-8"
              >
                Get Started
              </Button>
            </div>

          </div>
        </section>

        {/* FAQs */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 w-full">
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

        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
};

export default PricingPage;
