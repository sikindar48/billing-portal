import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Clock, DollarSign, Zap, BarChart3, Mail, Lock } from 'lucide-react';

const FreelancerInvoicingPage = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: <Clock className="w-5 h-5" />, title: "Save 10+ Hours/Month", desc: "Automate invoicing instead of manual spreadsheets. Create invoices in seconds." },
    { icon: <DollarSign className="w-5 h-5" />, title: "Get Paid Faster", desc: "Professional invoices get paid 2x faster. Track payments automatically." },
    { icon: <Zap className="w-5 h-5" />, title: "Zero Setup Time", desc: "Start invoicing in 2 minutes. No complex setup or learning curve." },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Track Your Income", desc: "See exactly how much you've earned, what's pending, and what's overdue." },
    { icon: <Mail className="w-5 h-5" />, title: "Email Invoices Directly", desc: "Send invoices via email with one click. Clients get payment links instantly." },
    { icon: <Lock className="w-5 h-5" />, title: "Secure & Compliant", desc: "Bank-grade security. GST-compliant for Indian freelancers." },
  ];

  const useCases = [
    { role: "Web Designer", desc: "Create project-based invoices with hourly rates or fixed prices" },
    { role: "Consultant", desc: "Track retainer clients and recurring billing automatically" },
    { role: "Freelance Writer", desc: "Invoice per article or per word with custom rates" },
    { role: "Developer", desc: "Bill hourly, daily, or project-based with detailed breakdowns" },
    { role: "Photographer", desc: "Create session-based invoices with package pricing" },
    { role: "Virtual Assistant", desc: "Track time-based work and recurring monthly invoices" },
  ];

  return (
    <>
      <SEO
        title="Invoicing Software for Freelancers - Free & Easy | Invoice Port"
        description="Best invoicing software designed for freelancers, writers & consultants. Create unlimited custom invoices, track payments, send automated email alerts, and get paid 2x faster."
        keywords="invoicing software for freelancers, freelancer invoice software, freelance billing software, invoice generator for freelancers, freelance invoicing app"
        canonicalUrl="/invoicing-software-for-freelancers"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Invoice Port - Freelancer Invoicing",
          "description": "Professional invoicing software for freelancers",
          "applicationCategory": "BusinessApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
          }
        }}
      />

      <div className="min-h-screen bg-[#0B0F19] text-white">
        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-900/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-xl font-bold tracking-tight hover:text-purple-400 transition-colors">
            InvoicePort
          </button>
          <Button onClick={() => navigate('/')} variant="ghost" className="text-white hover:bg-white/10">
            Back to Home
          </Button>
        </nav>

        {/* Hero */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Built for Freelancers
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Invoicing Software
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Built for Freelancers
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Stop wasting time on invoicing. Create professional invoices in seconds, get paid faster, and focus on your work. Designed specifically for freelancers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => navigate('/')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-6 rounded-xl text-lg"
            >
              Start 3-Day Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Create in seconds
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Get paid faster
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Track income
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              3-day trial
            </div>
          </div>
        </div>

        {/* Benefits */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Freelancers Love Invoice Port</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 transition-all">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-slate-400 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Perfect for Every Freelancer</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 transition-all">
                <h3 className="text-lg font-bold text-purple-400 mb-2">{useCase.role}</h3>
                <p className="text-slate-400">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 bg-slate-900/30 rounded-2xl border border-white/10">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Hourly & Project Billing", desc: "Bill hourly, daily, or per project. Mix and match rates." },
              { title: "Recurring Invoices", desc: "Set up monthly retainers that invoice automatically." },
              { title: "Payment Tracking", desc: "See which invoices are paid, pending, or overdue." },
              { title: "Client Portal", desc: "Clients can view invoices and make payments online." },
              { title: "Tax Calculations", desc: "Automatic GST, IGST, CGST+SGST calculations." },
              { title: "Email Delivery", desc: "Send invoices directly to clients with payment links." },
              { title: "PDF Export", desc: "Download invoices as professional PDFs." },
              { title: "Income Analytics", desc: "Track earnings, revenue trends, and growth." },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Stop Wasting Time on Invoicing</h2>
            <p className="text-slate-300 mb-8 text-lg">Join 10,000+ freelancers using Invoice Port to get paid faster.</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-6 rounded-xl text-lg"
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

export default FreelancerInvoicingPage;
