import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Users, TrendingUp, Shield, Zap, BarChart3, Settings } from 'lucide-react';

const SmallBusinessInvoicingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <Users className="w-5 h-5" />, title: "Unlimited Clients", desc: "Manage unlimited client profiles and invoicing relationships." },
    { icon: <TrendingUp className="w-5 h-5" />, title: "Business Growth", desc: "Scale from 1 to 1000+ clients without changing tools." },
    { icon: <Shield className="w-5 h-5" />, title: "Professional Image", desc: "Custom branded invoices that reflect your business." },
    { icon: <Zap className="w-5 h-5" />, title: "Faster Payments", desc: "Professional invoices get paid 2x faster on average." },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Business Insights", desc: "Real-time revenue tracking and financial analytics." },
    { icon: <Settings className="w-5 h-5" />, title: "Easy Integration", desc: "Works with your existing tools and workflows." },
  ];

  const industries = [
    "Service-Based Businesses",
    "Consulting Firms",
    "Digital Agencies",
    "E-commerce Stores",
    "Professional Services",
    "Retail Businesses",
    "Startups",
    "Nonprofits"
  ];

  return (
    <>
      <SEO
        title="Invoicing Software for Small Business - Professional Billing | Invoice Port"
        description="Professional invoicing software for small businesses. Manage clients, track payments, and grow your business. Free to start, scales with you. No credit card required."
        keywords="invoicing software for small business, small business billing software, professional invoice software, business invoicing tool, small business invoice generator"
        canonicalUrl="/invoicing-software-for-small-business"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Invoice Port - Small Business",
          "description": "Professional invoicing software for small businesses",
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
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-900/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-xl font-bold tracking-tight hover:text-emerald-400 transition-colors">
            InvoicePort
          </button>
          <Button onClick={() => navigate('/')} variant="ghost" className="text-white hover:bg-white/10">
            Back to Home
          </Button>
        </nav>

        {/* Hero */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            For Growing Businesses
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Invoicing Software
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              for Small Business
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Professional invoicing that grows with your business. Manage clients, track payments, and scale without complexity. Try our 3-Day Free Trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-6 rounded-xl text-lg"
            >
              Start 3-Day Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Unlimited clients
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Professional templates
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Payment tracking
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3-day trial
            </div>
          </div>
        </div>

        {/* Features */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Built for Small Business Success</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 transition-all">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Industries */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Perfect for Any Industry</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {industries.map((industry, i) => (
              <div key={i} className="p-4 rounded-lg border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 transition-all text-center">
                <p className="font-semibold">{industry}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Features */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 bg-slate-900/30 rounded-2xl border border-white/10">
          <h2 className="text-3xl font-bold text-center mb-12">Everything Your Business Needs</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Client Management", desc: "Store unlimited client profiles with contact details and payment preferences." },
              { title: "Product Catalog", desc: "Create a catalog of products/services with standard pricing." },
              { title: "Recurring Billing", desc: "Set up automatic monthly or recurring invoices." },
              { title: "Payment Tracking", desc: "Track paid, pending, and overdue invoices at a glance." },
              { title: "Custom Branding", desc: "Add your logo and customize invoice appearance." },
              { title: "Tax Compliance", desc: "Automatic GST, IGST, CGST+SGST calculations." },
              { title: "Email Integration", desc: "Send invoices directly to clients with payment links." },
              { title: "Financial Reports", desc: "Revenue reports, payment analytics, and business insights." },
              { title: "Multi-Currency", desc: "Invoice in INR, USD, EUR with automatic conversion." },
              { title: "PDF Export", desc: "Download and print professional invoices." },
              { title: "Client Portal", desc: "Clients can view invoices and make payments online." },
              { title: "Mobile Responsive", desc: "Create invoices on desktop, tablet, or mobile." },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Simple, Transparent Pricing</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free Trial",
                price: "₹0",
                desc: "Perfect to evaluate features",
                features: ["10 Invoices Limit", "3 Days Access", "5 Downloads Limit", "Basic Templates"]
              },
              {
                name: "Pro",
                price: "₹149",
                desc: "Per month",
                features: ["Everything in Free", "Advanced analytics", "API access", "Priority support", "Custom domain"],
                highlight: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                desc: "For large teams",
                features: ["Everything in Pro", "White-label", "Team management", "Dedicated support", "Custom integrations"]
              }
            ].map((plan, i) => (
              <div key={i} className={`p-8 rounded-2xl border transition-all ${plan.highlight ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20' : 'border-white/10 bg-slate-900/50'}`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 mb-4">{plan.desc}</p>
                <p className="text-3xl font-bold mb-6">{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/')}
                  className={`w-full ${plan.highlight ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'} text-white font-bold py-2 rounded-lg`}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Billing?</h2>
            <p className="text-slate-300 mb-8 text-lg">Join thousands of small businesses using Invoice Port.</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-6 rounded-xl text-lg"
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

export default SmallBusinessInvoicingPage;
