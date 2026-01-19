import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Building2, Mail, Phone, Globe, MapPin, Palette, 
  CreditCard, Save, Upload, Loader2, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import { 
  initiateGmailOAuth, 
  checkGmailConnection, 
  disconnectGmail 
} from '../utils/gmailOAuthService';
import GmailTestButton from '@/components/GmailTestButton';

const BusinessSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gmailStatus, setGmailStatus] = useState({ connected: false, checking: true });
  const [settings, setSettings] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    logo_url: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    invoice_prefix: 'INV',
    invoice_number_start: 1001,
    currency: 'INR',
    tax_rate: 18.00,
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    email_signature: '',
    email_footer: '',
    preferred_email_method: 'emailjs',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    sendgrid_api_key: ''
  });

  useEffect(() => {
    fetchBusinessSettings();
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const status = await checkGmailConnection();
      setGmailStatus({ ...status, checking: false });
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      setGmailStatus({ connected: false, checking: false, error: error.message });
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to access business settings');
        return;
      }

      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          ...settings,
          user_id: user.id,
          company_name: user.user_metadata?.full_name || 'My Business',
          company_email: user.email
        };
        
        const { data: newSettings, error: createError } = await supabase
          .from('business_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
      toast.error('Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to save settings');
        return;
      }

      const { error } = await supabase
        .from('business_settings')
        .upsert({
          ...settings,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Business settings saved successfully!');
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast.error('Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGmailConnect = () => {
    try {
      initiateGmailOAuth();
    } catch (error) {
      console.error('Error initiating Gmail OAuth:', error);
      toast.error('Failed to start Gmail connection');
    }
  };

  const handleGmailDisconnect = async () => {
    try {
      const result = await disconnectGmail();
      if (result.success) {
        toast.success('Gmail disconnected successfully');
        setGmailStatus({ connected: false, checking: false });
        setSettings(prev => ({ ...prev, preferred_email_method: 'emailjs' }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Failed to disconnect Gmail');
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Business Settings</h1>
        <p className="text-slate-400">Configure your business information for invoices and emails</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Company Information */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Company Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Company Name *</Label>
              <Input
                value={settings.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Your Company Name"
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Email Address</Label>
              <Input
                type="email"
                value={settings.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                placeholder="contact@yourcompany.com"
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Phone Number</Label>
              <Input
                value={settings.company_phone}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Website</Label>
              <Input
                value={settings.company_website}
                onChange={(e) => handleInputChange('company_website', e.target.value)}
                placeholder="https://yourcompany.com"
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Address</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Address Line 1</Label>
              <Input
                value={settings.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                placeholder="Street address"
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Address Line 2</Label>
              <Input
                value={settings.address_line2}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
                placeholder="Apartment, suite, etc."
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">City</Label>
                <Input
                  value={settings.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className="bg-slate-950/50 border-slate-800 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">State</Label>
                <Input
                  value={settings.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                  className="bg-slate-950/50 border-slate-800 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Postal Code</Label>
                <Input
                  value={settings.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="110001"
                  className="bg-slate-950/50 border-slate-800 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Country</Label>
                <Input
                  value={settings.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="India"
                  className="bg-slate-950/50 border-slate-800 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Invoice Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Invoice Prefix</Label>
                <Input
                  value={settings.invoice_prefix}
                  onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                  placeholder="INV"
                  className="bg-slate-950/50 border-slate-800 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Starting Number</Label>
                <Input
                  type="number"
                  value={settings.invoice_number_start}
                  onChange={(e) => handleInputChange('invoice_number_start', parseInt(e.target.value))}
                  placeholder="1001"
                  className="bg-slate-950/50 border-slate-800 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Currency</Label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 text-white rounded-lg"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              
              <div>
                <Label className="text-slate-300">Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.tax_rate}
                  onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value))}
                  placeholder="18.00"
                  className="bg-slate-950/50 border-slate-800 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Branding</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Logo URL</Label>
              <Input
                value={settings.logo_url}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                placeholder="https://yourcompany.com/logo.png"
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-16 h-10 bg-slate-950/50 border-slate-800"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1 bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-slate-300">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-16 h-10 bg-slate-950/50 border-slate-800"
                  />
                  <Input
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1 bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Information */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Payment Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Bank Name</Label>
            <Input
              value={settings.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              placeholder="State Bank of India"
              className="bg-slate-950/50 border-slate-800 text-white"
            />
          </div>
          
          <div>
            <Label className="text-slate-300">Account Number</Label>
            <Input
              value={settings.account_number}
              onChange={(e) => handleInputChange('account_number', e.target.value)}
              placeholder="1234567890"
              className="bg-slate-950/50 border-slate-800 text-white"
            />
          </div>
          
          <div>
            <Label className="text-slate-300">IFSC Code</Label>
            <Input
              value={settings.ifsc_code}
              onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
              placeholder="SBIN0001234"
              className="bg-slate-950/50 border-slate-800 text-white"
            />
          </div>
          
          <div>
            <Label className="text-slate-300">UPI ID</Label>
            <Input
              value={settings.upi_id}
              onChange={(e) => handleInputChange('upi_id', e.target.value)}
              placeholder="yourname@paytm"
              className="bg-slate-950/50 border-slate-800 text-white"
            />
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Email Configuration</h2>
        </div>
        
        <div className="space-y-6">
          {/* Email Method Selection */}
          <div>
            <Label className="text-slate-300 mb-3 block">Email Delivery Method</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <input 
                    type="radio" 
                    name="email_method" 
                    value="gmail"
                    checked={settings.preferred_email_method === 'gmail'}
                    onChange={(e) => handleInputChange('preferred_email_method', e.target.value)}
                    className="text-indigo-500"
                  />
                  <h3 className="font-semibold text-white">Gmail Integration</h3>
                </div>
                <p className="text-sm text-slate-400">Send emails from your Gmail account (Recommended)</p>
                <div className="mt-2 text-xs text-emerald-400">✅ Professional sender address</div>
              </div>
              
              <div className="p-4 border border-slate-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <input 
                    type="radio" 
                    name="email_method" 
                    value="smtp"
                    checked={settings.preferred_email_method === 'smtp'}
                    onChange={(e) => handleInputChange('preferred_email_method', e.target.value)}
                    className="text-indigo-500"
                  />
                  <h3 className="font-semibold text-white">Custom SMTP</h3>
                </div>
                <p className="text-sm text-slate-400">Use your own email server settings</p>
                <div className="mt-2 text-xs text-emerald-400">✅ Full control & authentication</div>
              </div>
              
              <div className="p-4 border border-slate-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <input 
                    type="radio" 
                    name="email_method" 
                    value="sendgrid"
                    checked={settings.preferred_email_method === 'sendgrid'}
                    onChange={(e) => handleInputChange('preferred_email_method', e.target.value)}
                    className="text-indigo-500"
                  />
                  <h3 className="font-semibold text-white">SendGrid</h3>
                </div>
                <p className="text-sm text-slate-400">Professional email delivery service</p>
                <div className="mt-2 text-xs text-blue-400">💰 Paid service required</div>
              </div>
              
              <div className="p-4 border border-slate-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <input 
                    type="radio" 
                    name="email_method" 
                    value="emailjs"
                    checked={settings.preferred_email_method === 'emailjs'}
                    onChange={(e) => handleInputChange('preferred_email_method', e.target.value)}
                    className="text-indigo-500"
                  />
                  <h3 className="font-semibold text-white">EmailJS (Basic)</h3>
                </div>
                <p className="text-sm text-slate-400">Simple email delivery (fallback option)</p>
                <div className="mt-2 text-xs text-yellow-400">⚠️ Generic sender address</div>
              </div>
            </div>
          </div>

          {/* Gmail Configuration */}
          {settings.preferred_email_method === 'gmail' && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Gmail Setup</h3>
              <GmailTestButton />
            </div>
          )}

          {/* SMTP Configuration */}
          {settings.preferred_email_method === 'smtp' && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-white font-semibold mb-3">SMTP Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">SMTP Host</Label>
                  <Input
                    value={settings.smtp_host || ''}
                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">SMTP Port</Label>
                  <Input
                    type="number"
                    value={settings.smtp_port || 587}
                    onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                    placeholder="587"
                    className="bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Username</Label>
                  <Input
                    value={settings.smtp_username || ''}
                    onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Password/App Password</Label>
                  <Input
                    type="password"
                    value={settings.smtp_password || ''}
                    onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                    placeholder="Your app password"
                    className="bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  <strong>Gmail Users:</strong> Use your Gmail address and create an "App Password" in your Google Account settings.
                </p>
              </div>
            </div>
          )}

          {/* SendGrid Configuration */}
          {settings.preferred_email_method === 'sendgrid' && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-white font-semibold mb-3">SendGrid Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">SendGrid API Key</Label>
                  <Input
                    type="password"
                    value={settings.sendgrid_api_key || ''}
                    onChange={(e) => handleInputChange('sendgrid_api_key', e.target.value)}
                    placeholder="SG.xxxxxxxxxxxxxxxx"
                    className="bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    Get your API key from <a href="https://sendgrid.com" target="_blank" className="underline">SendGrid Dashboard</a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email Content Settings */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Email Content</h3>
            <div>
              <Label className="text-slate-300">Email Signature</Label>
              <Textarea
                value={settings.email_signature}
                onChange={(e) => handleInputChange('email_signature', e.target.value)}
                placeholder="Best regards,&#10;Your Name&#10;Your Company"
                rows={3}
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Email Footer</Label>
              <Textarea
                value={settings.email_footer}
                onChange={(e) => handleInputChange('email_footer', e.target.value)}
                placeholder="This invoice was generated by Your Company Name"
                rows={2}
                className="bg-slate-950/50 border-slate-800 text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Business Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BusinessSettings;