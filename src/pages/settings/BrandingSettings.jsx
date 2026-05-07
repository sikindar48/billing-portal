import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Building2, Mail, FileText } from 'lucide-react';
import GmailConnect from '@/components/GmailConnect';

const BrandingSettings = () => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    company_tagline: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    address_line1: '',
    logo_url: '',
    invoice_prefix: 'INV',
    currency: 'INR',
    tax_rate: 18,
    preferred_email_method: 'emailjs',
  });

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        // Fetch branding settings
        const { data } = await supabase
          .from('branding_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setSettings(prev => ({
            ...prev,
            company_name: data.company_name || '',
            logo_url: data.logo_url || '',
            company_website: data.website || '',
            // Extra fields stored in metadata JSONB if present
            company_tagline: data.metadata?.tagline || '',
            company_email: data.metadata?.email || '',
            company_phone: data.metadata?.phone || '',
            address_line1: data.metadata?.address || '',
            invoice_prefix: data.metadata?.invoice_prefix || 'INV',
            currency: data.metadata?.currency || 'INR',
            tax_rate: data.metadata?.tax_rate ?? 18,
            preferred_email_method: data.metadata?.preferred_email_method || 'emailjs',
          }));
        }
      } catch (e) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          company_name: settings.company_name,
          logo_url: settings.logo_url,
          website: settings.company_website,
          // Extra fields packed into metadata JSONB
          metadata: {
            tagline: settings.company_tagline,
            email: settings.company_email,
            phone: settings.company_phone,
            address: settings.address_line1,
            invoice_prefix: settings.invoice_prefix,
            currency: settings.currency,
            tax_rate: settings.tax_rate,
            preferred_email_method: settings.preferred_email_method,
          },
        }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Settings saved');
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Failed to save: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Branding & Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your company info, invoice defaults, and email configuration.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

          {/* SIDEBAR */}
          <div className="xl:col-span-1 space-y-6">

            {/* Logo Preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Logo Preview</h3>
              <div className="flex flex-col items-center gap-3 mb-4">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="h-16 w-auto object-contain rounded"
                    onError={e => { 
                      e.target.style.display = 'none'; 
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="h-16 w-16 rounded-xl bg-indigo-50 flex items-center justify-center"
                  style={{ display: settings.logo_url ? 'none' : 'flex' }}
                >
                  <Building2 className="h-8 w-8 text-indigo-300" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm">{settings.company_name || 'Your Company'}</p>
                  {settings.company_tagline && (
                    <p className="text-xs text-gray-400 italic mt-0.5">{settings.company_tagline}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Logo URL</Label>
                <Input
                  value={settings.logo_url || ''}
                  onChange={e => set('logo_url', e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>
            </div>

            {/* Invoice Defaults */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Invoice Defaults
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Invoice Prefix</Label>
                  <Input
                    value={settings.invoice_prefix || 'INV'}
                    onChange={e => set('invoice_prefix', e.target.value)}
                    placeholder="INV"
                    className="text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Currency</Label>
                  <select
                    value={settings.currency || 'INR'}
                    onChange={e => set('currency', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.tax_rate ?? 18}
                    onChange={e => set('tax_rate', parseFloat(e.target.value) || 0)}
                    placeholder="18"
                    className="text-sm mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="xl:col-span-3 space-y-6">

            {/* Company Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" /> Company Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Company Name</Label>
                  <Input value={settings.company_name || ''} onChange={e => set('company_name', e.target.value)} placeholder="Your Company Name" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Tagline</Label>
                  <Input value={settings.company_tagline || ''} onChange={e => set('company_tagline', e.target.value)} placeholder="e.g. Building the future" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input type="email" value={settings.company_email || ''} onChange={e => set('company_email', e.target.value)} placeholder="contact@company.com" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input value={settings.company_phone || ''} onChange={e => set('company_phone', e.target.value)} placeholder="+91 98765 43210" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Website</Label>
                  <Input value={settings.company_website || ''} onChange={e => set('company_website', e.target.value)} placeholder="https://yourcompany.com" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Address</Label>
                  <Input value={settings.address_line1 || ''} onChange={e => set('address_line1', e.target.value)} placeholder="123 Main St, City, State" className="mt-1" />
                </div>
              </div>
            </div>

            {/* Email Config */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-500" /> Email Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {/* Gmail Integration - Pro Only */}
                <label className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                  subscription?.subscription_plans?.slug === 'monthly' || subscription?.subscription_plans?.slug === 'yearly'
                    ? `cursor-pointer ${settings.preferred_email_method === 'gmail' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`
                    : 'cursor-not-allowed opacity-60 border-gray-200'
                }`}>
                  <input 
                    type="radio" 
                    name="email_method" 
                    value="gmail" 
                    checked={settings.preferred_email_method === 'gmail'} 
                    onChange={e => {
                      if (subscription?.subscription_plans?.slug === 'monthly' || subscription?.subscription_plans?.slug === 'yearly') {
                        set('preferred_email_method', e.target.value);
                      } else {
                        toast.error('Gmail integration is only available for Pro plan users');
                      }
                    }} 
                    disabled={subscription?.subscription_plans?.slug !== 'monthly' && subscription?.subscription_plans?.slug !== 'yearly'}
                    className="mt-0.5 accent-indigo-600" 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">Gmail Integration</p>
                      {subscription?.subscription_plans?.slug === 'monthly' || subscription?.subscription_plans?.slug === 'yearly' ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Pro</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Pro Only</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Send from your Gmail account</p>
                    <p className="text-xs mt-1 text-emerald-600">✅ Recommended</p>
                  </div>
                </label>

                {/* EmailJS - Available for all */}
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${settings.preferred_email_method === 'emailjs' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="email_method" value="emailjs" checked={settings.preferred_email_method === 'emailjs'} onChange={e => set('preferred_email_method', e.target.value)} className="mt-0.5 accent-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">EmailJS (Basic)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Simple fallback delivery</p>
                    <p className="text-xs mt-1 text-yellow-600">⚠️ Generic sender</p>
                  </div>
                </label>
              </div>

              {/* Gmail Info Box - Show only if Pro */}
              {settings.preferred_email_method === 'gmail' && (subscription?.subscription_plans?.slug === 'monthly' || subscription?.subscription_plans?.slug === 'yearly') && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">Connect your Gmail account to send invoices professionally.</p>
                  <GmailConnect />
                </div>
              )}

              {/* Pro Plan Required Message */}
              {subscription?.subscription_plans?.slug !== 'monthly' && subscription?.subscription_plans?.slug !== 'yearly' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>💡 Upgrade to Pro:</strong> Gmail integration is available for Pro plan users. Upgrade now to send invoices from your own Gmail account.
                  </p>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Settings</>
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;
