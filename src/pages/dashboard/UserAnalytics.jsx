import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, TrendingUp, DollarSign, FileText, BarChart3,
  Calendar, ArrowUpRight, AlertCircle, CheckCircle2, Clock, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatCurrency';

const UserAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    collectedRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
    totalInvoices: 0,
    paidCount: 0,
    sentCount: 0,
    draftCount: 0,
    avgInvoiceValue: 0,
    collectionRate: 0,
    emailUsage: { sent: 0, limit: 0, percentage: 0 },
    monthlyData: [],
    recentInvoices: [],
    topCustomers: []
  });

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch invoices + email usage in parallel
      const [invoiceRes, emailRes, subRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, grand_total, created_at, bill_to, customer_name, invoice_details')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('email_usage_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('user_subscriptions')
          .select('email_usage_count, email_limit')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      // --- Email usage ---
      const emailLimit = subRes.data?.email_limit ?? 50;
      const emailSent = typeof emailRes.count === 'number' ? emailRes.count : (subRes.data?.email_usage_count ?? 0);
      const emailUsage = {
        sent: emailSent,
        limit: emailLimit,
        percentage: emailLimit > 0 ? ((emailSent / emailLimit) * 100).toFixed(1) : 0
      };

      const invoices = invoiceRes.data || [];

      if (invoices.length === 0) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        setAnalytics(prev => ({
          ...prev,
          emailUsage,
          monthlyData: months.map(name => ({ name, value: 0 }))
        }));
        return;
      }

      // --- Invoice stats ---
      let totalRevenue = 0, collectedRevenue = 0, pendingRevenue = 0, overdueRevenue = 0;
      let paidCount = 0, sentCount = 0, draftCount = 0;
      const customerMap = new Map();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthlyMap = {};
      months.forEach(m => (monthlyMap[m] = 0));
      const now = new Date();

      invoices.forEach(inv => {
        const total = parseFloat(inv.grand_total) || 0;
        const status = (inv.invoice_details?.status || 'draft').toLowerCase();

        totalRevenue += total;

        if (status === 'paid') { collectedRevenue += total; paidCount++; }
        else if (status === 'sent') {
          pendingRevenue += total; sentCount++;
          if (inv.invoice_details?.payment_date && new Date(inv.invoice_details.payment_date) < now) {
            overdueRevenue += total;
          }
        } else if (status === 'draft') { draftCount++; }

        const name = inv.customer_name || inv.bill_to?.name || 'Unknown';
        customerMap.set(name, (customerMap.get(name) || 0) + total);

        const date = new Date(inv.created_at);
        if (date.getFullYear() === now.getFullYear()) {
          monthlyMap[months[date.getMonth()]] += total;
        }
      });

      const topCustomers = Array.from(customerMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        collectedRevenue,
        pendingRevenue,
        overdueRevenue,
        totalInvoices: invoices.length,
        paidCount,
        sentCount,
        draftCount,
        avgInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        collectionRate: totalRevenue > 0 ? ((collectedRevenue / totalRevenue) * 100).toFixed(1) : 0,
        emailUsage,
        monthlyData: months.map(name => ({ name, value: monthlyMap[name] })),
        recentInvoices: invoices.slice(0, 5),
        topCustomers
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Your invoicing performance and revenue overview</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Create Invoice
          </Button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {formatCurrency(analytics.totalRevenue, 'INR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">{analytics.totalInvoices} invoices total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {formatCurrency(analytics.collectedRevenue, 'INR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">{analytics.collectionRate}% collection rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {formatCurrency(analytics.pendingRevenue, 'INR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">{analytics.sentCount} sent invoices</p>
            </CardContent>
          </Card>

          <Card className={analytics.overdueRevenue > 0 ? 'border-red-200' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${analytics.overdueRevenue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {formatCurrency(analytics.overdueRevenue, 'INR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Past due date</p>
            </CardContent>
          </Card>
        </div>

        {/* Email Usage + Invoice Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Email Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                Email Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Emails Sent</span>
                    <span className="font-semibold">{analytics.emailUsage.sent} / {analytics.emailUsage.limit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        analytics.emailUsage.percentage >= 90 ? 'bg-red-500' :
                        analytics.emailUsage.percentage >= 70 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(analytics.emailUsage.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{analytics.emailUsage.percentage}% of limit used</p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  {analytics.emailUsage.percentage >= 90 ? (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">⚠️ Approaching limit — upgrade your plan</div>
                  ) : analytics.emailUsage.percentage >= 70 ? (
                    <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-sm">📊 Moderate usage — monitor closely</div>
                  ) : (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">✅ Healthy usage — within limits</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Paid', count: analytics.paidCount, color: '#10b981' },
                  { label: 'Sent', count: analytics.sentCount, color: '#3b82f6' },
                  { label: 'Draft', count: analytics.draftCount, color: '#94a3b8' }
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <span className="text-gray-600">{item.count} invoices</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: analytics.totalInvoices > 0
                            ? `${(item.count / analytics.totalInvoices) * 100}%`
                            : '0%',
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
               
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart + Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full flex items-end justify-center pb-2">
                {analytics.totalRevenue > 0 ? (
                  <SimpleBarChart data={analytics.monthlyData} />
                ) : (
                  <div className="text-center text-gray-400">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No revenue data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

           {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCustomers.length > 0 ? (
                  analytics.topCustomers.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 truncate max-w-[60%]">{c.name}</span>
                        <span className="text-gray-600 font-semibold">{formatCurrency(c.value, 'INR')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${(c.value / analytics.topCustomers[0].value) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No customer data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

// Simple Bar Chart Component
const SimpleBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 100);

  return (
    <div className="w-full h-full flex items-end justify-around gap-1 px-2">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex flex-col items-center flex-1 max-w-[40px]">
            <div
              className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-all relative group"
              style={{ height: `${height}%`, minHeight: item.value > 0 ? '4px' : '0' }}
            >
              {item.value > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {formatCurrency(item.value, 'INR')}
                </div>
              )}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">{item.name}</div>
          </div>
        );
      })}
    </div>
  );
};

export default UserAnalytics;
