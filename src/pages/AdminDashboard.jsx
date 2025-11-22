import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Users, TrendingUp, AlertCircle, Trash2, Inbox, Check, X, Settings, Calendar } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { toast } from 'sonner';

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
      const { data: userData, error: userError } = await supabase.rpc('get_admin_dashboard_data');
      if (userError) throw userError;
      setUsers(userData || []);

      // 2. Fetch Pending Requests
      const { data: reqData, error: reqError } = await supabase
        .from('subscription_requests')
        // Select profile (for email, name) and the plan name
        .select('*, profiles(email, full_name), subscription_plans(name)') 
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (reqError) console.warn("Error fetching requests:", reqError);
      
      const validRequests = (reqData || []).filter(req => req.profiles); 
      setRequests(validRequests);

      // Calculate stats
      const total = userData.length;
      const active = userData.filter(u => u.status === 'active').length;
      const trialing = userData.filter(u => u.status === 'trialing').length;
      setStats({ total, active, trialing });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard data");
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
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
      if (error) throw error;
      toast.success("User deleted");
      fetchData();
    } catch (error) { toast.error(error.message); }
    finally { setProcessingId(null); }
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
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={req.message}>
                                        {/* Clean up message prefix */}
                                        {req.message.replace(/Requesting Pro Plan \(.+\). Note: /, '') || 'No Message'}
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