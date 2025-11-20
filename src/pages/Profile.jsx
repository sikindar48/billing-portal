import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, Phone, Lock, Save, ShieldCheck, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile State
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    mobile: ''
  });

  // Password State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch profile data from public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
         // If no profile exists yet, we just use auth email
         console.error("Error fetching profile:", error);
      }

      setProfile({
        full_name: data?.full_name || '',
        mobile: data?.mobile || '',
        email: user.email // Email comes from Auth, read-only here usually
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          mobile: profile.mobile,
          email: profile.email, // Keep email in sync
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;
      toast.success("Password updated successfully!");
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
            <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-800 pl-0 hover:bg-transparent"
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Account Settings</h1>
            <p className="text-gray-500">Manage your personal information and security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 1. Personal Information Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <User className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input value={profile.email} disabled className="bg-gray-50 text-gray-500" />
                        <p className="text-xs text-gray-400">Email cannot be changed here.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="fullName"
                                value={profile.full_name}
                                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                                className="pl-10"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="mobile"
                                value={profile.mobile}
                                onChange={(e) => setProfile({...profile, mobile: e.target.value})}
                                className="pl-10"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Profile
                    </Button>
                </form>
            </div>

            {/* 2. Security Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPass">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="newPass"
                                type="password"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                className="pl-10"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPass">Confirm Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="confirmPass"
                                type="password"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                className="pl-10"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={saving} variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 mt-4">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Update Password"}
                    </Button>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;