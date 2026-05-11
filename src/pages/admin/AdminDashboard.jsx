import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Users, CreditCard, Activity, ShieldCheck,
  TrendingUp, RefreshCw, Check, X, Zap, Mail, Megaphone,
  IndianRupee, ArrowUpRight, BarChart3, Bell, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import User360Tab from './components/User360Tab';
import PaymentsTab from './components/PaymentsTab';
import AuditLogsTab from './components/AuditLogsTab';
import SystemHealthTab from './components/SystemHealthTab';
import ResendEmailUsageTab from './components/ResendEmailUsageTab';
import BroadcastTab from './components/BroadcastTab';

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, gradient, sub, trend }) => (
  <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 group">
    <div className={`absolute inset-0 ${gradient} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
    <CardContent className="pt-5 pb-4 relative">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{label}</p>
          <h3 className="text-2xl font-bold mt-1.5 text-gray-900 truncate">{value}</h3>
          {sub && (
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
              {sub}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-10 shrink-0 ml-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const VALID_TABS = ['users', 'payments', 'audit', 'health', 'mails', 'broadcast'];

const AdminDashboard = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = VALID_TABS.includes(tab) ? tab : 'users';
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({
    users: [],
    payments: [],
    auditLogs: [],
    requests: [],
    resendStats: null,
    stats: { totalUsers: 0, activeSubs: 0, totalRevenue: 0, totalCaptured: 0 }
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError]     = useState(null);

  const paymentsLoaded  = useRef(false);
  const auditLogsLoaded = useRef(false);
  const resendLoaded    = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchCriticalData();
    fetchPayments();
    fetchAuditLogs();
    fetchResendStats();
  }, []);

  const handleTabChange = (tab) => {
    navigate(`/admin/${tab}`, { replace: true });
    if (tab === 'payments') fetchPayments();
    if (tab === 'audit') fetchAuditLogs();
    if (tab === 'mails') fetchResendStats();
  };

  const fetchCriticalData = async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes, plansRes] = await Promise.all([
        supabase.rpc('get_admin_users_detailed'),
        supabase.from('subscription_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('id, name')
      ]);

      if (usersRes.error) throw usersRes.error;

      let enrichedRequests = [];
      if (requestsRes.data?.length > 0) {
        const userIds = requestsRes.data.map(r => r.user_id);
        const { data: profileData } = await supabase.from('profiles').select('id, email').in('id', userIds);
        enrichedRequests = requestsRes.data.map(req => ({
          ...req,
          profiles: profileData?.find(p => p.id === req.user_id),
          subscription_plans: plansRes.data?.find(p => p.id === req.plan_id)
        }));
      }

      const users = usersRes.data || [];

      setData(prev => ({
        ...prev,
        users,
        requests: enrichedRequests,
        stats: {
          ...prev.stats,
          totalUsers: users.length,
          activeSubs: users.filter(u => u.out_subscription_status === 'active').length,
        }
      }));
    } catch (error) {
      console.error('Admin Fetch Error:', error);
      toast.error('Failed to load admin data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (paymentsLoaded.current) return;
    paymentsLoaded.current = true;
    try {
      const { data: payments, error } = await supabase.rpc('get_admin_payment_reconciliation');
      if (error) throw error;
      const captured = (payments || []).filter(p => p.status === 'captured');
      const totalRevenue = captured.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setData(prev => ({
        ...prev,
        payments: payments || [],
        stats: { ...prev.stats, totalRevenue, totalCaptured: captured.length }
      }));
    } catch (error) {
      paymentsLoaded.current = false;
      console.error('Payments fetch error:', error);
    }
  };

  const fetchAuditLogs = async () => {
    if (auditLogsLoaded.current) return;
    auditLogsLoaded.current = true;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        // Schema cache or table missing — surface the error
        auditLogsLoaded.current = false;
        setAuditError(error.message);
        console.error('Audit logs fetch error:', error);
        return;
      }

      let enrichedLogs = logs || [];
      if (enrichedLogs.length > 0) {
        const userIds = [...new Set(enrichedLogs.filter(l => l.user_id).map(l => l.user_id))];
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);
          enrichedLogs = enrichedLogs.map(log => ({
            ...log,
            user_profile: profileData?.find(p => p.id === log.user_id)
          }));
        }
      }
      setData(prev => ({ ...prev, auditLogs: enrichedLogs }));
    } catch (error) {
      auditLogsLoaded.current = false;
      setAuditError(error.message);
      console.error('Audit logs fetch error:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchResendStats = async () => {
    if (resendLoaded.current) return;
    resendLoaded.current = true;
    try {
      const { data: resendStats, error } = await supabase.rpc('get_admin_resend_email_stats', {});
      if (error) throw error;
      setData(prev => ({ ...prev, resendStats: resendStats || null }));
    } catch (error) {
      resendLoaded.current = false;
      console.error('Resend stats fetch error:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    paymentsLoaded.current  = false;
    auditLogsLoaded.current = false;
    resendLoaded.current    = false;
    setAuditError(null);
    await fetchCriticalData();
    await Promise.all([fetchPayments(), fetchAuditLogs(), fetchResendStats()]);
    setLoading(false);
  };

  const handleApproveRequest = async (request) => {
    try {
      const { data: res, error } = await supabase.rpc('admin_override_subscription', {
        p_user_id: request.user_id,
        p_action: 'activate_pro'
      });
      if (error) throw error;
      await supabase.from('subscription_requests').update({ status: 'approved' }).eq('id', request.id);
      toast.success('Subscription approved and activated');
      fetchCriticalData();
    } catch {
      toast.error('Approval failed');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await supabase.from('subscription_requests').update({ status: 'rejected' }).eq('id', id);
      toast.success('Request rejected');
      fetchCriticalData();
    } catch {
      toast.error('Rejection failed');
    }
  };

  if (loading && data.users.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 relative z-10" />
        </div>
        <p className="text-gray-500 font-medium text-sm">Loading Command Center…</p>
      </div>
    );
  }

  const conversion = data.stats.totalUsers > 0
    ? Math.round((data.stats.activeSubs / data.stats.totalUsers) * 100)
    : 0;

  const TABS = [
    { value: 'users',     label: 'Users',     Icon: Users },
    { value: 'payments',  label: 'Payments',  Icon: CreditCard },
    { value: 'audit',     label: 'Audit',     Icon: Activity },
    { value: 'health',    label: 'Health',    Icon: Zap },
    { value: 'mails',     label: 'Mails',     Icon: Mail },
    { value: 'broadcast', label: 'Broadcast', Icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

            {/* Left: Title */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-inner">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-none tracking-tight">
                  Admin Command Center
                </h1>
                <p className="text-indigo-200 text-[12px] mt-1 font-medium">
                  {format(now, "EEEE, MMM d · HH:mm")} · Global platform oversight
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {data.requests.length > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 rounded-full px-3 py-1.5">
                  <Bell className="h-3.5 w-3.5 text-orange-300 animate-pulse" />
                  <span className="text-orange-200 text-[11px] font-bold">
                    {data.requests.length} Pending
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllData}
                disabled={loading}
                className="h-9 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Sync All
              </Button>
            </div>
          </div>

          {/* ── Inline Stat Cards (inside header) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              {
                label: 'Total Users',
                value: data.stats.totalUsers,
                Icon: Users,
                sub: `${data.stats.activeSubs} active pro`,
                gradient: 'bg-white/20',
                textColor: 'text-white',
                subColor: 'text-indigo-200',
              },
              {
                label: 'Active Pro',
                value: data.stats.activeSubs,
                Icon: TrendingUp,
                sub: `${conversion}% conversion`,
                gradient: 'bg-white/20',
                textColor: 'text-white',
                subColor: 'text-indigo-200',
              },
              {
                label: 'Total Revenue',
                value: `₹${data.stats.totalRevenue.toLocaleString()}`,
                Icon: IndianRupee,
                sub: `${data.stats.totalCaptured} captured`,
                gradient: 'bg-white/20',
                textColor: 'text-white',
                subColor: 'text-indigo-200',
              },
              {
                label: 'Pending Requests',
                value: data.requests.length,
                Icon: Bell,
                sub: data.requests.length > 0 ? 'Needs attention' : 'All clear',
                gradient: 'bg-white/20',
                textColor: 'text-white',
                subColor: data.requests.length > 0 ? 'text-orange-300' : 'text-indigo-200',
              },
            ].map(({ label, value, Icon, sub, gradient, textColor, subColor }) => (
              <div
                key={label}
                className={`${gradient} backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3.5 hover:bg-white/25 transition-colors`}
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest truncate">{label}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${textColor} truncate`}>{value}</h3>
                    {sub && <p className={`text-[11px] mt-0.5 ${subColor} truncate`}>{sub}</p>}
                  </div>
                  <div className="p-2 bg-white/10 rounded-xl shrink-0 ml-2">
                    <Icon className="h-4 w-4 text-white/80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* ── Pending Requests Banner ── */}
        {data.requests.length > 0 && (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                Action Required — {data.requests.length} Pending Subscription{data.requests.length > 1 ? 's' : ''}
              </span>
              <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200 text-[10px] font-bold">
                Awaiting Review
              </Badge>
            </div>

            {/* Request rows */}
            {data.requests.map((req, i) => (
              <div
                key={req.id}
                className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50/60 transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-200 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {req.profiles?.email || 'Unknown User'}
                    </div>
                    <div className="text-[11px] text-indigo-600 font-bold">
                      {req.subscription_plans?.name || 'Unknown Plan'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 px-3 shadow-sm"
                    onClick={() => handleApproveRequest(req)}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRejectRequest(req.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

          {/* Tab List + Search Row */}
          <div className="flex items-center gap-3">
            {/* Tabs — left */}
            <div className="overflow-x-auto pb-1 -mx-1 px-1 flex-1 min-w-0">
              <TabsList className="bg-white border border-gray-200 shadow-sm rounded-2xl h-12 p-1.5 gap-1 flex flex-nowrap w-fit">
                {TABS.map(({ value, label, Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 h-9 whitespace-nowrap text-xs font-semibold text-gray-500 transition-all hover:text-gray-700 hover:bg-gray-50"
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Search — right, only on users tab */}
            {activeTab === 'users' && (
              <div className="relative shrink-0 w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search users…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="mt-5">
            <TabsContent value="users">
              <User360Tab users={data.users} onRefresh={fetchCriticalData} searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="payments">
              <PaymentsTab payments={data.payments} />
            </TabsContent>
            <TabsContent value="audit">
              <AuditLogsTab
                logs={data.auditLogs}
                loading={auditLoading}
                error={auditError}
                onRetry={() => {
                  auditLogsLoaded.current = false;
                  setAuditError(null);
                  fetchAuditLogs();
                }}
              />
            </TabsContent>
            <TabsContent value="health">
              <SystemHealthTab />
            </TabsContent>
            <TabsContent value="mails">
              <ResendEmailUsageTab prefetchedStats={data.resendStats} />
            </TabsContent>
            <TabsContent value="broadcast">
              <BroadcastTab allUsers={data.users} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
