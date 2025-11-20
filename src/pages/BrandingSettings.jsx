import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Use relative path to avoid build errors with alias
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, ArrowLeft, Building2, Globe, ImageIcon, Save } from 'lucide-react';
import Navigation from '@/components/Navigation'; 

const BrandingSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadBrandingSettings();
  }, []);

  const loadBrandingSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCompanyName(data.company_name || '');
        setWebsite(data.website || '');
        setLogoUrl(data.logo_url || '');
      }
    } catch (error) {
      toast.error('Failed to load branding settings');
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

      // 1. Validate File Type
      if (!file.type.startsWith('image/')) {
          toast.error("Invalid file type. Please upload an image (PNG, JPG).");
          setUploading(false);
          return;
      }

      // 2. Validate File Size (Max 200KB)
      const LIMIT_KB = 200;
      if (file.size > LIMIT_KB * 1024) {
          toast.error(`File is too large. Maximum size is ${LIMIT_KB}KB.`);
          setUploading(false);
          return;
      }

      const fileExt = file.name.split('.').pop();
      // Use timestamp to ensure uniqueness and avoid browser caching of old images
      const fileName = `${userId}-${Date.now()}.${fileExt}`; 
      
      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload logo. Please check if the "logos" bucket exists in Supabase.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: userId,
          company_name: companyName,
          website: website,
          logo_url: logoUrl,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Branding settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save branding settings');
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
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-800 pl-0 hover:bg-transparent"
            >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Branding Settings</h1>
            <p className="text-gray-500">Customize how your business appears on invoices.</p>
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
                {/* Form Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-gray-700">Company Name</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building2 className="h-4 w-4" /></div>
                            <Input
                                id="companyName"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Acme Corp."
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
                                placeholder="https://www.example.com"
                                className="pl-10"
                            />
                        </div>
                    </div>
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
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;