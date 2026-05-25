import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PublicFooter from '@/components/PublicFooter';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { 
  Zap, ShieldCheck, BarChart3, Globe, FileText, 
  Repeat, Settings, Users, Rocket, ArrowRight, CheckCircle2 
} from 'lucide-react';

const FeatureCard = ({ icon, title, desc, color }) => {
  const colorMap = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    pink: "text-pink-400 bg-pink-500/10"
  };

  return (
    <div className="group p-8 rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/50 hover:border-white/10 transition-all duration-300">
      <div className={`mb-6 inline-flex items-center justify-center p-4 rounded-xl ${colorMap[color]} transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <h4 className="text-xl font-bold text-white mb-3">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
};

const FeaturesPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Features - High-Performance Invoicing Capabilities | Invoice Port"
        description="Explore the key features of Invoice Port: GST billing, professional templates, multi-currency transactions, client registers, and analytics."
        keywords="invoice features, GST calculation, automatic invoicing, invoice templates, billing features"
        canonicalUrl="/features"
      />
      <div className="min-h-screen bg-[#0B0F19] text-white font-sans overflow-x-hidden flex flex-col justify-between">
        
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-900/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Header */}
        <Navbar />

        {/* Hero Area */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Engineered for speed. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Built for precision.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We stripped away the spreadsheet complexity. What's left is the fastest, most secure way to bill your clients.
          </p>
        </section>

        {/* Core Capabilities */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={<Zap className="w-6 h-6" />} title="Instant Generation" desc="Create high-fidelity PDF invoices in milliseconds. Fast rendering ensures smooth workflow." color="indigo" />
            <FeatureCard icon={<ShieldCheck className="w-6 h-6" />} title="Bank-Grade Security" desc="Enterprise-grade encryption for all financial data. Your client information is isolated and secure." color="emerald" />
            <FeatureCard icon={<BarChart3 className="w-6 h-6" />} title="Live Analytics" desc="Visualize revenue, track outstanding payments, and monitor growth with real-time dashboards." color="blue" />
            <FeatureCard icon={<Globe className="w-6 h-6" />} title="Multi-Currency Support" desc="Create invoices in major currencies (INR, USD, EUR) with proper currency symbols and formatting." color="purple" />
            <FeatureCard icon={<FileText className="w-6 h-6" />} title="9 Professional Templates" desc="Choose from 9 GST-compliant templates that match your brand. Upload logos and customize branding." color="pink" />
            <FeatureCard icon={<Repeat className="w-6 h-6" />} title="Payment Tracking" desc="Record payments, track transaction details, and automatically update invoice status to paid." color="orange" />
          </div>
        </section>

        {/* How It Works - Brand Workflow */}
        <section className="relative z-10 py-24 bg-slate-900/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-purple-400 font-semibold tracking-widest uppercase text-sm mb-3">Simple Process</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Set up once, use forever.</h3>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                Each user gets their own branded experience. Your clients will see YOUR company name, logo, and contact details on every invoice and email.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative p-8 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white">Brand Setup</h4>
                  </div>
                  <div className="space-y-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm">Upload YOUR company logo</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm">Add YOUR business contact details</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm">Choose YOUR preferred template</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm">Set YOUR payment terms & methods</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative p-8 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white">Client & Service Catalog</h4>
                  </div>
                  <div className="space-y-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Add client profiles once</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Create product/service catalog</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Set standard pricing & rates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Configure tax and GST settings</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative p-8 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white">Generate & Send</h4>
                  </div>
                  <div className="space-y-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm">Select client & standard services</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm">Add items - prices auto-populate</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm">Review & send via email link</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm">Download PDF instantly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Area */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-3xl p-12 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-4">Ready to automate your financial billing?</h2>
            <p className="text-slate-300 mb-8 text-lg">Save 5+ hours per week on manual invoice management.</p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-6 rounded-xl text-lg"
            >
              Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
};

export default FeaturesPage;
