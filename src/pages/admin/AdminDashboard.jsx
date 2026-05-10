import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Loader2, Users, CreditCard, Activity, ShieldCheck, 
    TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Inbox, Check, X
} from 'lucide-react';
import { toast } from 'sonner';

// Custom Tab Components
import User360Tab from './components/User360Tab';
import PaymentsTab from './components/PaymentsTab';
import AuditLogsTab from './components/AuditLogsTab';
import SystemHealthTab from './components/SystemHealthTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [],
    payments: [],
    auditLogs: [],
    requests: [],
    stats: { totalUsers: 0, activeSubs: 0, totalRevenue: 0 }
  });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel via our new secure RPCs
      const [usersRes, paymentsRes, auditRes, requestsRes] = await Promise.all([
        supabase.rpc('get_admin_users_detailed'),
        supabase.rpc('get_admin_payment_reconciliation'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('subscription_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      ]);

      if (usersRes.error) throw usersRes.error;
      
      // Calculate Stats
      const users = usersRes.data || [];
      const payments = paymentsRes.data || [];
      const totalRevenue = payments
        .filter(p => p.status === 'captured')
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      setData({
        users,
        payments,
        auditLogs: auditRes.data || [],
        requests: requestsRes.data || [],
        stats: {
          totalUsers: users.length,
          activeSubs: users.filter(u => u.subscription_status === 'active').length,
          totalRevenue
        }
      });
    } catch (error) {
      console.error('Admin Fetch Error:', error);
      toast.error('Failed to load admin data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveRequest = async (request) => {
    try {
        const { data: res, error } = await supabase.rpc('admin_override_subscription', {
            p_user_id: request.user_id,
            p_action: 'activate_pro'
        });
        if (error) throw error;
        
        await supabase.from('subscription_requests').update({ status: 'approved' }).eq('id', request.id);
        toast.success('Subscription approved and activated');
        fetchAdminData();
    } catch (error) {
        toast.error('Approval failed');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
        await supabase.from('subscription_requests').update({ status: 'rejected' }).eq('id', id);
        toast.success('Request rejected');
        fetchAdminData();
    } catch (error) {
        toast.error('Rejection failed');
    }
  };

  if (loading && data.users.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-gray-500 font-medium">Booting Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Area */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" /> 
                    Admin Command Center
                </h1>
                <p className="text-sm text-gray-500">Global platform oversight and management</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAdminData}>
                <RefreshCw className="h-4 w-4 mr-2" /> Sync Data
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Rapid Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white shadow-sm border-none">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                            <h3 className="text-2xl font-bold mt-1">{data.stats.totalUsers}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Users className="h-5 w-5" /></div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-none">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Pro</p>
                            <h3 className="text-2xl font-bold mt-1 text-green-600">{data.stats.activeSubs}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp className="h-5 w-5" /></div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-none">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-2xl font-bold mt-1">₹{data.stats.totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><CreditCard className="h-5 w-5" /></div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-indigo-600 shadow-md border-none text-white">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Pending Tasks</p>
                            <h3 className="text-2xl font-bold mt-1">{data.requests.length}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg text-white"><Inbox className="h-5 w-5" /></div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Pending Requests (Immediate Action Items) */}
        {data.requests.length > 0 && (
            <Card className="mb-8 border-l-4 border-l-orange-500 overflow-hidden">
                <CardHeader className="py-3 bg-orange-50/50">
                    <CardTitle className="text-sm font-bold text-orange-800 flex items-center gap-2">
                        <Inbox className="h-4 w-4" /> Action Required: Pending Subscriptions
                    </CardTitle>
                </CardHeader>
                <div className="p-0">
                    {data.requests.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-4 border-t first:border-t-0 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
                                    {req.user_id.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">{req.user_id}</div>
                                    <div className="text-xs text-gray-500">Requested Plan ID: {req.plan_id}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={() => handleApproveRequest(req)}>
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-600" onClick={() => handleRejectRequest(req.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        )}

        {/* Tabbed Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm mb-6 border w-full md:w-auto h-auto grid grid-cols-2 md:flex">
            <TabsTrigger value="users" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg py-2.5 px-6">
                <Users className="h-4 w-4 mr-2" /> Users 360
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg py-2.5 px-6">
                <CreditCard className="h-4 w-4 mr-2" /> Payments
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg py-2.5 px-6">
                <Activity className="h-4 w-4 mr-2" /> Audit Stream
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg py-2.5 px-6">
                <Zap className="h-4 w-4 mr-2" /> System Health
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="users">
                <User360Tab users={data.users} onRefresh={fetchAdminData} />
            </TabsContent>
            
            <TabsContent value="payments">
                <PaymentsTab payments={data.payments} />
            </TabsContent>
            
            <TabsContent value="audit">
                <AuditLogsTab logs={data.auditLogs} />
            </TabsContent>

            <TabsContent value="health">
                <SystemHealthTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
