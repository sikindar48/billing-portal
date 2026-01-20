import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { checkEmailUsageLimit, getEmailUsageStats } from '@/utils/emailUsageService';
import { getEmailCapabilities } from '@/utils/invoiceEmailService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, AlertCircle, CheckCircle, Crown, Zap } from 'lucide-react';

const EmailUsageTest = () => {
  const [loading, setLoading] = useState(true);
  const [emailStats, setEmailStats] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view email usage');
        return;
      }
      
      setUserId(user.id);
      
      // Load email usage stats
      const stats = await getEmailUsageStats();
      setEmailStats(stats);
      
      // Load email capabilities
      const caps = await getEmailCapabilities(user.id);
      setCapabilities(caps);
      
    } catch (error) {
      console.error('Error loading email data:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadEmailData();
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!emailStats || !capabilities) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load email usage data</span>
        </div>
        <Button onClick={refreshData} className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Usage Status */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Usage Status
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Plan Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {emailStats.isPro ? (
                <Crown className="w-6 h-6 text-yellow-500" />
              ) : (
                <Zap className="w-6 h-6 text-blue-500" />
              )}
              <div>
                <h4 className="font-semibold text-gray-900">
                  {emailStats.planName}
                </h4>
                <p className="text-sm text-gray-600">
                  {emailStats.isPro ? 'Pro Plan Features' : 'Trial Plan'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {emailStats.isPro ? (
                <div className="text-emerald-600 font-semibold">
                  ✨ Unlimited
                </div>
              ) : (
                <div className="text-gray-700">
                  {emailStats.currentUsage} / {emailStats.emailLimit}
                </div>
              )}
            </div>
          </div>

          {/* Usage Progress */}
          {!emailStats.isPro && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Email Usage</span>
                <span>{emailStats.currentUsage} of {emailStats.emailLimit} used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    emailStats.currentUsage >= emailStats.emailLimit 
                      ? 'bg-red-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.min((emailStats.currentUsage / emailStats.emailLimit) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Send Status */}
          <div className={`p-3 rounded-lg border ${
            emailStats.canSendEmail 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {emailStats.canSendEmail ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                emailStats.canSendEmail ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {emailStats.canSendEmail 
                  ? 'Ready to send emails' 
                  : 'Email limit reached'
                }
              </span>
            </div>
            {!emailStats.canSendEmail && (
              <p className="text-sm text-red-600 mt-1">
                Upgrade to Pro for unlimited email sending
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Available Methods */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-green-100">
          <h3 className="text-lg font-semibold text-green-900">
            Available Email Methods
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          {/* EmailJS */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">InvoicePort Mail</h4>
              <p className="text-sm text-gray-600">EmailJS delivery service</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">Available</span>
            </div>
          </div>

          {/* Gmail */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Gmail Integration</h4>
              <p className="text-sm text-gray-600">Send from your Gmail account</p>
            </div>
            <div className="flex items-center gap-2">
              {capabilities.planRestrictions?.isPro ? (
                capabilities.gmailConnected ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">Not Connected</span>
                  </>
                )
              ) : (
                <>
                  <Crown className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500 font-medium">Pro Only</span>
                </>
              )}
            </div>
          </div>

          {/* Plan Restrictions */}
          {capabilities.planRestrictions?.restriction && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>Restriction:</strong> {capabilities.planRestrictions.restriction}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {emailStats.recentActivity && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b border-purple-100">
            <h3 className="text-lg font-semibold text-purple-900">
              Recent Activity (30 days)
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {emailStats.recentActivity.sent}
                </div>
                <div className="text-sm text-emerald-700">Sent</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {emailStats.recentActivity.failed}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {emailStats.recentActivity.total}
                </div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default EmailUsageTest;