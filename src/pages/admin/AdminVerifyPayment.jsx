import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, ArrowLeft, AlertTriangle, User, Hash } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';

const AdminVerifyPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [planData, setPlanData] = useState(null);

  const requestId = searchParams.get('request_id');
  const userId = searchParams.get('user_id');

  useEffect(() => {
    if (requestId && userId) {
      fetchRequestData();
    } else {
      toast.error('Invalid verification link');
      setLoading(false);
    }
  }, [requestId, userId]);

  const fetchRequestData = async () => {
    try {
      setLoading(true);

      // Fetch subscription request
      const { data: request, error: requestError } = await supabase
        .from('subscription_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', userId)
        .maybeSingle();

      if (requestError) {
        console.error('Request error:', requestError);
        throw new Error('Subscription request not found');
      }
      setRequestData(request);

      // Fetch user data from auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !user) {
        // Fallback: try to get user email from auth.users
        const { data: authUser } = await supabase.auth.getUser();
        setUserData({ 
          email: authUser?.user?.email || 'Unknown',
          full_name: authUser?.user?.user_metadata?.full_name || 'User'
        });
      } else {
        setUserData({
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email
        });
      }

      // Fetch plan data
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', request.plan_id)
        .maybeSingle();

      if (planError) {
        console.error('Plan error:', planError);
        throw new Error('Plan not found');
      }
      setPlanData(plan);

    } catch (error) {
      console.error('Error fetching request data:', error);
      toast.error(error.message || 'Failed to load payment verification data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      // Update subscription request status
      const { error: updateError } = await supabase
        .from('subscription_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create or update user subscription
      const subscriptionData = {
        user_id: userId,
        plan_id: requestData.plan_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (planData.slug.includes('yearly') ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: false
      };

      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (subError) throw subError;

      toast.success('Payment verified and subscription activated!', { duration: 4000 });
      setTimeout(() => navigate('/admin'), 2000);
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Payment verification rejected');
      setTimeout(() => navigate('/admin'), 2000);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Extract transaction ID from message
  const extractTransactionId = (message) => {
    const match = message?.match(/Transaction ID: ([^\s.]+)/);
    return match ? match[1] : 'N/A';
  };

  // Extract amount from message
  const extractAmount = (message) => {
    const match = message?.match(/Amount: ₹(\d+)/);
    return match ? match[1] : planData?.price || 'N/A';
  };

  // Extract billing cycle from message
  const extractBillingCycle = (message) => {
    if (message?.includes('Monthly')) return 'Monthly';
    if (message?.includes('Yearly')) return 'Yearly';
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading payment details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
              <p className="text-gray-600 mb-6">The payment verification request could not be found.</p>
              <Button onClick={() => navigate('/admin')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const transactionId = extractTransactionId(requestData.message);
  const amount = extractAmount(requestData.message);
  const billingCycle = extractBillingCycle(requestData.message);
  const isAlreadyProcessed = requestData.status !== 'pending';

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          {/* Header */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="mb-2 hover:bg-white h-8 text-sm"
            >
              <ArrowLeft className="w-3 h-3 mr-2" />
              Back to Admin
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  💳 Payment Verification
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Review and approve subscription payment</p>
              </div>
              {isAlreadyProcessed && (
                <Badge variant={requestData.status === 'approved' ? 'default' : 'destructive'} className="text-xs px-3 py-1">
                  {requestData.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Status Alert */}
          {isAlreadyProcessed && (
            <Card className="mb-6 border-yellow-300 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900">Already Processed</p>
                    <p className="text-sm text-yellow-700">
                      This request has been {requestData.status}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2-Column Compact Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* User & Payment Combined */}
              <Card className="border-indigo-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b py-3">
                  <CardTitle className="flex items-center gap-2 text-indigo-900 text-base">
                    <User className="w-4 h-4 flex-shrink-0" />
                    User & Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Name</p>
                      <p className="font-semibold text-sm text-gray-900">{userData?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Email</p>
                      <p className="font-semibold text-sm text-gray-900 truncate" title={userData?.email}>{userData?.email}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Plan</p>
                        <Badge variant="default" className="text-xs px-2 py-0.5">{planData?.name}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Cycle</p>
                        <p className="font-semibold text-sm text-gray-900">{billingCycle}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Amount</p>
                        <p className="text-2xl font-bold text-green-600 leading-none">₹{amount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Payment Method</p>
                        <p className="font-semibold text-sm text-gray-900">UPI</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">UPI ID</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 inline-block">
                          invoiceport@ybl
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Info */}
              <Card className="border-blue-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b py-3">
                  <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
                    <Hash className="w-4 h-4 flex-shrink-0" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 text-center">Transaction ID</p>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
                      <code className="text-xl font-mono font-bold text-blue-900 block text-center break-all leading-tight">
                        {transactionId}
                      </code>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1.5">Submitted</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {new Date(requestData.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {new Date(requestData.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1.5">Status</p>
                      <Badge variant={requestData.status === 'pending' ? 'secondary' : 'default'} className="text-xs px-2 py-0.5">
                        {requestData.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Action Buttons */}
              {!isAlreadyProcessed ? (
                <Card className="border-indigo-200 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3">
                    <CardTitle className="text-base">Verification Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-sm font-semibold shadow-lg"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve & Activate Subscription
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={processing}
                      variant="destructive"
                      className="w-full h-11 text-sm font-semibold"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Payment
                        </>
                      )}
                    </Button>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 text-center leading-relaxed">
                        ⚠️ Verify transaction ID in UPI app before approving
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-yellow-200 shadow-lg">
                  <CardHeader className="bg-yellow-50 border-b py-3">
                    <CardTitle className="text-base text-yellow-900">Already Processed</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-yellow-900">Status: {requestData.status}</p>
                        <p className="text-xs text-yellow-700 mt-1">This request has been {requestData.status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* IDs Reference */}
              <Card className="border-gray-200">
                <CardHeader className="bg-gray-50 border-b py-2">
                  <CardTitle className="text-xs text-gray-600">Reference IDs</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Request ID</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 block break-all">
                      {requestId}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">User ID</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 block break-all">
                      {userId}
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminVerifyPayment;
