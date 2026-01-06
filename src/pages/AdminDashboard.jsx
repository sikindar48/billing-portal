import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Users, TrendingUp, AlertCircle, Trash2, Inbox, Check, X, Settings, Calendar, Mail, Send } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { toast } from 'sonner';
import { sendOrderConfirmationEmail } from '@/utils/emailService';

const PLAN_OPTIONS = [
    { id: 1, name: 'Starter', slug: 'trial' },
    { id: 2, name: 'Pro', slug: 'pro' },
    { id: 3, name: 'Enterprise', slug: 'enterprise' }
];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, trialing: 0 });
  const [processingId, setProcessingId] = useState(null);

  const [manageDialog, setManageDialog] = useState({ open: false, user: null });
  const [newPlan, setNewPlan] = useState('2');
  const [newDuration, setNewDuration] = useState('monthly');

  useEffect(() => {
    fetchData();
    
    // Real-time updates for requests and subscriptions
    const channel = supabase.channel('admin-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_requests' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions' }, () => fetchData())
        .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    try {
      // 1. First, let's fetch users and their subscriptions separately to avoid relationship issues
      
      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Get all subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          plan_id,
          status,
          current_period_start,
          current_period_end,
          invoice_usage_count,
          subscription_plans (
            name
          )
        `);
      
      if (subscriptionsError) {
        console.error("Error fetching subscriptions:", subscriptionsError);
        // Don't throw here, just log the error and continue with empty subscriptions
      }

      // Combine the data manually
      const transformedUsers = (profilesData || []).map(profile => {
        const subscription = (subscriptionsData || []).find(sub => sub.user_id === profile.id);
        
        return {
          user_id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          plan_id: subscription?.plan_id || null,
          plan_name: subscription?.subscription_plans?.name || 'No Plan',
          status: subscription?.status || 'none',
          period_start: subscription?.current_period_start || null,
          period_end: subscription?.current_period_end || null,
          invoice_usage_count: subscription?.invoice_usage_count || 0,
          created_at: profile.created_at
        };
      });

      setUsers(transformedUsers);

      // 2. Fetch Pending Requests (also fetch separately to avoid relationship issues)
      const { data: requestsData, error: requestsError } = await supabase
        .from('subscription_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      console.log('Fetched subscription requests:', { requestsData, requestsError });
        
      if (requestsError) {
        console.warn("Error fetching requests:", requestsError);
        setRequests([]);
      } else {
        // Get profiles for the requests separately
        const userIds = (requestsData || []).map(req => req.user_id);
        const { data: requestProfilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        // Get plan names separately
        const planIds = (requestsData || []).map(req => req.plan_id);
        const { data: plansData } = await supabase
          .from('subscription_plans')
          .select('id, name')
          .in('id', planIds);

        // Combine request data manually
        const enrichedRequests = (requestsData || []).map(request => {
          const profile = (requestProfilesData || []).find(p => p.id === request.user_id);
          const plan = (plansData || []).find(p => p.id === request.plan_id);
          
          return {
            ...request,
            profiles: profile ? { email: profile.email, full_name: profile.full_name } : null,
            subscription_plans: plan ? { name: plan.name } : null
          };
        }).filter(req => req.profiles); // Only include requests with valid profiles

        setRequests(enrichedRequests);
      }

      // Calculate stats
      const total = transformedUsers.length;
      const active = transformedUsers.filter(u => u.status === 'active').length;
      const trialing = transformedUsers.filter(u => u.status === 'trialing').length;
      setStats({ total, active, trialing });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request) => {
      if(!window.confirm(`Approve plan ${request.subscription_plans.name} for ${request.profiles.email}?`)) return;
      
      setProcessingId(request.id);
      try {
          const isYearly = request.message.toLowerCase().includes('yearly');
          const startDate = new Date();
          const endDate = isYearly ? addYears(startDate, 1) : addMonths(startDate, 1);

          const { error: subError } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: request.user_id,
                plan_id: request.plan_id,
                status: 'active',
                current_period_start: startDate.toISOString(),
                current_period_end: endDate.toISOString(),
                invoice_usage_count: 0
            }, { onConflict: 'user_id' });

          if (subError) throw subError;
          await supabase.from('subscription_requests').update({ status: 'approved' }).eq('id', request.id);

          // Send order confirmation email only for paid plans
          try {
            const userName = request.profiles?.full_name || request.profiles?.email?.split('@')[0] || 'User';
            const userEmail = request.profiles?.email;

            // Only send emails for paid plans (plan_id > 1, assuming 1 is free trial)
            if (userEmail && request.plan_id > 1) {
              const orderDetails = {
                orderNumber: `ORD-${Date.now()}`,
                orderDate: new Date().toLocaleDateString(),
                planName: request.subscription_plans.name,
                amountPaid: isYearly ? '₹999' : '₹99',
                paymentMethod: 'Admin Approved',
                billingCycle: isYearly ? 'Yearly' : 'Monthly',
                nextBillingDate: endDate.toLocaleDateString()
              };
              
              await sendOrderConfirmationEmail(userEmail, userName, orderDetails);
              console.log('Order confirmation email sent successfully');
            }
          } catch (emailError) {
            console.warn('Failed to send order confirmation email:', emailError);
            // Don't fail the approval if email fails
          }

          toast.success(`Plan activated (${request.subscription_plans.name})`);
          fetchData();
      } catch (error) {
          toast.error("Approval failed");
      } finally {
          setProcessingId(null);
      }
  };

  const openManageDialog = (user) => {
      setManageDialog({ open: true, user });
      setNewPlan(user.plan_id ? String(user.plan_id) : '2'); 
      setNewDuration('monthly');
  };

  const handleManualUpdate = async () => {
      if (!manageDialog.user) return;
      setProcessingId('manual');

      try {
          const startDate = new Date();
          let endDate = new Date();
          let status = 'active';

          if (newDuration === 'monthly') endDate = addMonths(startDate, 1);
          else if (newDuration === 'yearly') endDate = addYears(startDate, 1);
          else if (newDuration === 'trial_reset') {
             endDate.setDate(endDate.getDate() + 3);
             status = 'trialing';
          }

          const planIdToSet = newDuration === 'trial_reset' ? 1 : parseInt(newPlan);

          const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: manageDialog.user.user_id,
                plan_id: planIdToSet,
                status: status,
                current_period_start: startDate.toISOString(),
                current_period_end: endDate.toISOString(),
                invoice_usage_count: 0
            }, { onConflict: 'user_id' });

          if (error) throw error;

          // Send order confirmation email only for paid plan upgrades
          try {
            const userProfile = users.find(u => u.user_id === manageDialog.user.user_id);
            const userName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User';
            const userEmail = userProfile?.email;

            // Only send emails for paid plan upgrades (not free plans or trial resets)
            if (userEmail && newDuration !== 'trial_reset' && parseInt(newPlan) > 1) {
              const newPlanName = getPlanNameById(newPlan);
              
              const orderDetails = {
                orderNumber: `UPG-${Date.now()}`,
                orderDate: new Date().toLocaleDateString(),
                planName: newPlanName,
                amountPaid: newDuration === 'monthly' ? '₹99' : '₹999',
                paymentMethod: 'Admin Upgrade',
                billingCycle: newDuration === 'monthly' ? 'Monthly' : 'Yearly',
                nextBillingDate: endDate.toLocaleDateString()
              };
              
              await sendOrderConfirmationEmail(userEmail, userName, orderDetails);
              console.log('Order confirmation email sent successfully');
            }
          } catch (emailError) {
            console.warn('Failed to send email notification:', emailError);
            // Don't fail the subscription update if email fails
          }

          toast.success("Subscription updated successfully!");
          setManageDialog({ open: false, user: null });
          fetchData();
      } catch (error) {
          console.error(error);
          toast.error("Failed to update subscription");
      } finally {
          setProcessingId(null);
      }
  };

  const handleRejectRequest = async (id) => {
      if(!window.confirm("Reject this request?")) return;
      setProcessingId(id);
      try {
          await supabase.from('subscription_requests').update({ status: 'rejected' }).eq('id', id);
          toast.success("Rejected");
          fetchData();
      } catch(e) { toast.error("Error rejecting."); }
      finally { setProcessingId(null); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setProcessingId(userId);
    try {
      console.log('Attempting to delete user:', userId);
      
      // First try the RPC function (if it exists)
        const { data, error } = await supabase.rpc('admin_delete_user', {
          target_user_id: userId
        });
        
        if (!error && data && data.success) {
          toast.success("User deleted successfully", { duration: 2000 });
          setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
          setTimeout(() => fetchData(), 1000);
          return;
        }
      
      // If RPC function doesn't work or doesn't exist, use fallback method
      console.log('RPC function not available or failed, using fallback method');
      
      // Check if trying to delete another admin
      const { data: roleCheck } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      if (roleCheck) {
        toast.error("Cannot delete admin users", { duration: 2000 });
        return;
      }

      // Delete related data (what we can access)
      const deletePromises = [
        supabase.from('subscription_requests').delete().eq('user_id', userId),
        supabase.from('user_subscriptions').delete().eq('user_id', userId),
        supabase.from('user_roles').delete().eq('user_id', userId),
        supabase.from('invoices').delete().eq('user_id', userId),
        supabase.from('profiles').delete().eq('id', userId)
      ];
      
      await Promise.all(deletePromises);
      
      toast.success("User data deleted (Note: Run the SQL script for complete deletion)", { duration: 3000 });
      
      // Update local state immediately
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
      
      // Refresh data
      setTimeout(() => fetchData(), 1000);
      
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user", { duration: 2000 });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
      switch(status) {
          case 'active': return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
          case 'trialing': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Trial</Badge>;
          case 'expired': return <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>;
          default: return <Badge variant="outline">{status || 'Unknown'}</Badge>;
      }
  };

  const getPlanNameById = (id) => {
      const plan = PLAN_OPTIONS.find(p => String(p.id) === id);
      return plan ? plan.name : 'Unknown';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <Badge variant="secondary">Administrator</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Active Subs</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{stats.active}</div></CardContent></Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending Requests</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-orange-600">{requests.length}</div>
                    {requests.length > 0 && <span className="flex h-3 w-3 rounded-full bg-orange-500 animate-pulse"></span>}
                </CardContent>
            </Card>
        </div>

        {/* --- REQUESTS TABLE (Enhanced Display) --- */}
        {requests.length > 0 && (
            <Card className="overflow-hidden mb-8 border-orange-200 shadow-sm">
                <CardHeader className="bg-orange-50/50 border-b border-orange-100">
                    <CardTitle className="flex items-center gap-2 text-orange-800"><Inbox className="h-5 w-5"/> Pending Subscription Requests</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-orange-700 uppercase bg-orange-50/30">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Requested Plan</th>
                                <th className="px-6 py-3">Transaction ID</th>
                                <th className="px-6 py-3">Notes</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-100">
                            {requests.map((req) => (
                                <tr key={req.id} className="bg-white hover:bg-orange-50/30">
                                    <td className="px-6 py-4 font-medium">
                                        <div className="text-gray-900">{req.profiles?.full_name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{req.profiles?.email || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-indigo-600">
                                        {req.subscription_plans?.name || getPlanNameById(req.plan_id)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {req.transaction_id ? (
                                            <div className="flex items-center gap-2">
                                                <code className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs font-mono border border-green-200">
                                                    {req.transaction_id}
                                                </code>
                                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Payment Made"></div>
                                            </div>
                                        ) : req.message && req.message.includes('Transaction ID:') ? (
                                            <div className="flex items-center gap-2">
                                                <code className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs font-mono border border-green-200">
                                                    {req.message.match(/Transaction ID: ([^.]+)/)?.[1] || 'Found in message'}
                                                </code>
                                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Payment Made"></div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">No payment</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={req.message}>
                                        {/* Clean up message prefix */}
                                        {req.message.replace(/Requesting Pro Plan \(.+\). Note: /, '').replace(/Payment made for .+ Plan \(.+\)\. Amount: .+\. UPI ID: .+/, 'Payment verification request') || 'No Message'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{format(new Date(req.created_at), 'MMM dd')}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" onClick={() => handleApproveRequest(req)} disabled={processingId === req.id} className="bg-green-600 h-8 px-3">
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req.id)} disabled={processingId === req.id} className="text-red-600 border-red-200 h-8 px-3">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}

        {/* Users Table */}
        <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100"><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600"/> User Management</CardTitle></CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr><th className="px-6 py-3">Email</th><th className="px-6 py-3">Plan</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Expires</th><th className="px-6 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.user_id} className="bg-white hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                                <td className="px-6 py-4 font-semibold text-indigo-600">{user.plan_name || 'None'}</td>
                                <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                <td className="px-6 py-4 text-gray-500">{user.period_end ? format(new Date(user.period_end), 'MMM dd, yyyy') : '-'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openManageDialog(user)} className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                            <Settings className="h-3.5 w-3.5 mr-1" /> Manage
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.user_id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>

      {/* --- MANAGE USER DIALOG --- */}
      <Dialog open={manageDialog.open} onOpenChange={(open) => setManageDialog({ ...manageDialog, open })}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Subscription</DialogTitle>
                <DialogDescription>Update plan for {manageDialog.user?.email}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Plan Tier</Label>
                    <Select 
                      value={newPlan} 
                      onValueChange={(val) => { setNewPlan(val); setNewDuration(val === '1' ? 'trial_reset' : 'monthly'); }}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {PLAN_OPTIONS.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name} (ID {p.id})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Duration / Action</Label>
                    <Select 
                        value={newDuration} 
                        onValueChange={setNewDuration} 
                        // Disable duration selection for Starter plan
                        disabled={newPlan === '1'}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {newPlan === '1' ? (
                                <SelectItem value="trial_reset">Reset to 3-Day Free Trial</SelectItem>
                            ) : (
                                <>
                                    <SelectItem value="monthly">{getPlanNameById(newPlan)} Monthly (+30 Days)</SelectItem>
                                    <SelectItem value="yearly">{getPlanNameById(newPlan)} Yearly (+1 Year)</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200 flex gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Saving will immediately update access and reset invoice usage to 0.
                </div>
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={() => setManageDialog({ open: false, user: null })}>Cancel</Button>
                <Button onClick={handleManualUpdate} disabled={processingId === 'manual'} className="bg-indigo-600 text-white">
                    {processingId === 'manual' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Subscription'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;