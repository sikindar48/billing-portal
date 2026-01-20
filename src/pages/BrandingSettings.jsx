import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Use relative path to avoid build errors with alias
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, ArrowLeft, Building2, Globe, ImageIcon, Save, Phone, MapPin, Mail, ExternalLink, TestTube, Send } from 'lucide-react';
import Navigation from '@/components/Navigation';
import GmailConnectionTest from '@/components/GmailConnectionTest';
import GmailSendTest from '@/components/GmailSendTest';
import { initiateGmailOAuth } from '@/utils/gmailOAuthService'; 

const BrandingSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Complete sender information fields
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [website, setWebsite] = useState('');
  
  // Address field (simplified)
  const [addressLine1, setAddressLine1] = useState('');
  
  // Other settings
  const [preferredEmailMethod, setPreferredEmailMethod] = useState('emailjs');
  const [logoUrl, setLogoUrl] = useState('');
  const [userId, setUserId] = useState(null);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const [showSendTest, setShowSendTest] = useState(false);

  useEffect(() => {
    loadBrandingSettings();
  }, []);

  const loadBrandingSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Company information
        setCompanyName(data.company_name || '');
        setCompanyEmail(data.company_email || '');
        setCompanyPhone(data.company_phone || '');
        setWebsite(data.company_website || '');
        
        // Address information (simplified)
        setAddressLine1(data.address_line1 || '');
        
        // Other settings
        setLogoUrl(data.logo_url || '');
        setPreferredEmailMethod(data.preferred_email_method || 'emailjs');
      }
    } catch (error) {
      console.error('Error loading branding settings:', error);
      toast.error('Failed to load branding settings', { duration: 2000 });
    }
  };

  const handleLogoUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) {
          setUploading(false);
          return;
      }

      if (!file.type.startsWith('image/')) {
          toast.error("Invalid file type. Please upload an image (PNG, JPG).", { duration: 2500 });
          setUploading(false);
          return;
      }

      const LIMIT_KB = 200;
      if (file.size > LIMIT_KB * 1024) {
          toast.error(`File is too large. Maximum size is ${LIMIT_KB}KB.`, { duration: 2500 });
          setUploading(false);
          return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`; 
      
      // First, try to upload to the icon bucket
      let uploadError = null;
      let { error } = await supabase.storage
        .from('icon')
        .upload(fileName, file, { upsert: true });
      
      uploadError = error;
      
      // If bucket doesn't exist, try to create it
      if (uploadError && uploadError.message && uploadError.message.includes('not found')) {
        console.log('Icon bucket not found, attempting to create it...');
        
        try {
          // Try to create the bucket
          const { error: bucketError } = await supabase.storage.createBucket('icon', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            fileSizeLimit: 1024 * 1024 // 1MB limit
          });
          
          if (bucketError) {
            console.warn('Could not create bucket:', bucketError);
            // If we can't create the bucket, try alternative bucket names
            const alternativeBuckets = ['logos', 'images', 'uploads'];
            
            for (const bucketName of alternativeBuckets) {
              console.log(`Trying alternative bucket: ${bucketName}`);
              const { error: altError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, { upsert: true });
              
              if (!altError) {
                const { data: { publicUrl } } = supabase.storage
                  .from(bucketName)
                  .getPublicUrl(fileName);
                
                setLogoUrl(publicUrl);
                toast.success(`Logo uploaded successfully to ${bucketName} bucket!`, { duration: 2000 });
                return;
              }
            }
            
            // If all alternatives fail, throw the original error
            throw new Error('No available storage bucket found. Please create an "icon" bucket in Supabase Storage.');
          } else {
            console.log('Icon bucket created successfully, retrying upload...');
            // Retry upload after creating bucket
            const { error: retryError } = await supabase.storage
              .from('icon')
              .upload(fileName, file, { upsert: true });
            
            if (retryError) throw retryError;
          }
        } catch (bucketCreationError) {
          console.error('Bucket creation failed:', bucketCreationError);
          throw new Error('Failed to create storage bucket. Please create an "icon" bucket manually in Supabase Storage.');
        }
      } else if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('icon')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded successfully!', { duration: 2000 });
    } catch (error) {
      console.error('Logo upload error:', error);
      
      if (error.message && error.message.includes('bucket')) {
        toast.error('Storage bucket not found. Please create an "icon" bucket in Supabase Storage.', { duration: 4000 });
      } else if (error.message && error.message.includes('permission')) {
        toast.error('Permission denied. Please check your Supabase storage policies.', { duration: 4000 });
      } else {
        toast.error(`Failed to upload logo: ${error.message}`, { duration: 3000 });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!companyName.trim()) {
        toast.error('Company name is required', { duration: 2000 });
        return;
      }

      // Save simplified business settings
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          user_id: userId,
          // Company information
          company_name: companyName.trim(),
          company_email: companyEmail.trim(),
          company_phone: companyPhone.trim(),
          company_website: website.trim(),
          
          // Address information (simplified)
          address_line1: addressLine1.trim(),
          
          // Other settings
          logo_url: logoUrl,
          preferred_email_method: preferredEmailMethod,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Business settings saved successfully!', { duration: 2000 });
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast.error('Failed to save business settings', { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
            <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-800 pl-0 hover:bg-transparent"
            >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Business Settings</h1>
            <p className="text-gray-500">Configure your business information for invoices and communications.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-indigo-100">
                <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    Company Details
                </h2>
            </div>

            <div className="p-8 space-y-8">
                {/* Company Information Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-gray-700">Company Name *</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building2 className="h-4 w-4" /></div>
                                <Input
                                    id="companyName"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Your Company Name"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyEmail" className="text-gray-700">Company Email</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="h-4 w-4" /></div>
                                <Input
                                    id="companyEmail"
                                    type="email"
                                    value={companyEmail}
                                    onChange={(e) => setCompanyEmail(e.target.value)}
                                    placeholder="contact@yourcompany.com"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyPhone" className="text-gray-700">Phone Number</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone className="h-4 w-4" /></div>
                                <Input
                                    id="companyPhone"
                                    value={companyPhone}
                                    onChange={(e) => setCompanyPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website" className="text-gray-700">Website</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Globe className="h-4 w-4" /></div>
                                <Input
                                    id="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.yourcompany.com"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Information Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Business Address</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="addressLine1" className="text-gray-700">Address</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin className="h-4 w-4" /></div>
                                <Input
                                    id="addressLine1"
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    placeholder="Complete business address"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Configuration Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-indigo-600" />
                        <Label className="text-gray-700 text-lg font-semibold">Email Configuration</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 mb-2">
                                <input 
                                    type="radio" 
                                    name="email_method" 
                                    value="gmail"
                                    checked={preferredEmailMethod === 'gmail'}
                                    onChange={(e) => setPreferredEmailMethod(e.target.value)}
                                    className="text-indigo-500"
                                />
                                <h3 className="font-semibold text-gray-900">Gmail Integration</h3>
                            </div>
                            <p className="text-sm text-gray-600">Send emails from your Gmail account (Recommended)</p>
                            <div className="mt-2 text-xs text-emerald-600">✅ Professional sender address</div>
                        </div>
                        
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 mb-2">
                                <input 
                                    type="radio" 
                                    name="email_method" 
                                    value="emailjs"
                                    checked={preferredEmailMethod === 'emailjs'}
                                    onChange={(e) => setPreferredEmailMethod(e.target.value)}
                                    className="text-indigo-500"
                                />
                                <h3 className="font-semibold text-gray-900">Email (Basic)</h3>
                            </div>
                            <p className="text-sm text-gray-600">Simple email delivery (fallback option)</p>
                            <div className="mt-2 text-xs text-yellow-600">⚠️ Generic sender address</div>
                        </div>
                    </div>

                    {/* Gmail Configuration */}
                    {preferredEmailMethod === 'gmail' && (
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h3 className="text-gray-900 font-semibold mb-3">Gmail Integration</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Gmail integration allows you to send invoices directly from your Gmail account. 
                                This feature provides professional email delivery with your own email address.
                            </p>
                            
                            {/* Pro Plan Notice */}
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-yellow-800 font-medium text-sm">Pro Feature</span>
                                </div>
                                <p className="text-yellow-700 text-sm">
                                    Gmail integration is available for Pro plan users only. 
                                    Trial users can send emails via InvoicePort mail (3 emails limit).
                                </p>
                            </div>
                            
                            {/* Gmail Connection Component */}
                            <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">Gmail Connection Status</h4>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setShowSendTest(!showSendTest)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Send
                                        </Button>
                                        <Button
                                            onClick={() => setShowConnectionTest(!showConnectionTest)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <TestTube className="w-4 h-4 mr-2" />
                                            Test
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                try {
                                                    initiateGmailOAuth();
                                                } catch (error) {
                                                    toast.error(`OAuth Error: ${error.message}`);
                                                }
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Connect Gmail (Pro Only)
                                        </Button>
                                    </div>
                                </div>
                                
                                {showSendTest && (
                                    <div className="mb-4">
                                        <GmailSendTest />
                                    </div>
                                )}
                                
                                {showConnectionTest && (
                                    <div className="mb-4">
                                        <GmailConnectionTest />
                                    </div>
                                )}
                                
                                <p className="text-sm text-gray-500">
                                    Click "Connect Gmail" to authorize InvoicePort to send emails from your Gmail account.
                                    <br />
                                    <span className="text-yellow-600 font-medium">Note: This feature requires a Pro subscription.</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* EmailJS Configuration */}
                    {preferredEmailMethod === 'emailjs' && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-gray-900 font-semibold mb-3">EmailJS Configuration</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                EmailJS provides reliable email delivery for your invoices. 
                                Emails are sent from InvoicePort with your company branding.
                            </p>
                            
                            {/* Plan-based limits */}
                            <div className="p-3 bg-white border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">Email Limits</h4>
                                    <span className="text-sm text-blue-600 font-medium">Current Plan</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Trial Users:</span>
                                        <span className="font-medium">3 emails total</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pro Users:</span>
                                        <span className="font-medium text-emerald-600">Unlimited emails</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-4">
                    <Label className="text-gray-700">Company Logo</Label>
                    
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Logo Preview */}
                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 relative overflow-hidden group">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="Company Logo"
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <ImageIcon className="h-10 w-10 text-gray-300" />
                            )}
                            {/* Loading Overlay */}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                </div>
                            )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-3">
                                <label htmlFor="logo-upload" className="cursor-pointer">
                                    <div className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors shadow-sm">
                                        <Upload className="h-4 w-4" />
                                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                                    </div>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                </label>
                                {uploading && <span className="text-sm text-gray-500 animate-pulse">Uploading...</span>}
                            </div>
                            <p className="text-sm text-gray-500">
                                Max size: <span className="font-bold text-gray-700">200KB</span>. Supported: PNG, JPG.
                                <br /> This logo will appear on all your generated invoices.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={loading} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 h-11 shadow-md transition-all"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Business Settings
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;