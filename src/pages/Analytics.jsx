import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, DollarSign, Mail, PieChart, Calendar, FileText, CreditCard, ArrowUpRight, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatCurrency';

const Analytics = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth(); // Read from context — no extra network calls
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    mrr: 0,
    activePlans: { trial: 0, pro: 0, enterprise: 0 },
    trialUsers: 0,
    conversionRate: 0,
    emailUsage: { sent: 0, limit: 0, percentage: 0 },
    planDistribution: [],
    // Invoice statistics
    totalRevenue: 0,
    totalInvoices: 0,
    avgInvoiceValue: 0,
    recentInvoices: [],
    monthlyData: []
  });

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      if (!user) return;

      // Platform-wide subscription metrics — admin only (isAdmin from AuthContext)
      let mrr = 0;
      let activePlans = { trial: 0, pro: 0, enterprise: 0 };
      let trialUsers = 0;
      let conversionRate = 0;
      let planDistribution = [];

      if (isAdmin) {
        const { data: subscriptions, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`*, subscription_plans(name, slug, price, billing_period)`);

        if (!subError && subscriptions) {
          subscriptions.forEach(sub => {
            if (sub.status === 'active' && sub.subscription_plans) {
              const price = parseFloat(sub.subscription_plans.price);
              if (sub.subscription_plans.billing_period === 'yearly') mrr += price / 12;
              else if (sub.subscription_plans.billing_period === 'monthly') mrr += price;
            }
          });

          activePlans = {
            trial: subscriptions.filter(s => s.subscription_plans?.slug === 'trial' && s.status === 'trialing').length,
            pro: subscriptions.filter(s => s.subscription_plans?.slug === 'monthly' && s.status === 'active').length,
            enterprise: subscriptions.filter(s => s.subscription_plans?.slug === 'yearly' && s.status === 'active').length
          };

          trialUsers = subscriptions.filter(s => s.status === 'trialing').length;
          const totalUsers = subscriptions.length || 1;
          const paidUsers = subscriptions.filter(s => s.status === 'active' && s.subscription_plans?.slug !== 'trial').length;
          conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0;

          planDistribution = [
            { name: 'Trial', value: activePlans.trial, color: '#3b82f6' },
            { name: 'Pro', value: activePlans.pro, color: '#10b981' },
            { name: 'Enterprise', value: activePlans.enterprise, color: '#8b5cf6' }
          ].filter(p => p.value > 0);
        }
      }

      // Email usage stats - handle if table doesn't exist
      let emailUsage = {
        sent: 0,
        limit: 10,
        percentage: 0
      };

      try {
        const { data: emailStats, error: emailError } = await supabase
          .from('email_usage_log')
          .select('emails_sent_count, email_limit')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!emailError && emailStats) {
          emailUsage = {
            sent: emailStats.emails_sent_count || 0,
            limit: emailStats.email_limit || 10,
            percentage: emailStats ? ((emailStats.emails_sent_count / emailStats.email_limit) * 100).toFixed(1) : 0
          };
        }
      } catch (emailErr) {
        console.warn('Email usage tracking not available:', emailErr);
      }

      // Fetch invoice statistics (scoped to current user, limited for performance)
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_number, grand_total, created_at, bill_to')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      let totalRevenue = 0;
      let totalInvoices = 0;
      let avgInvoiceValue = 0;
      let recentInvoices = [];
      let monthlyData = [];

      if (!invError && invoices && invoices.length > 0) {
        // Calculate invoice KPIs
        totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.grand_total) || 0), 0);
        totalInvoices = invoices.length;
        avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
        recentInvoices = invoices.slice(0, 5);

        // Calculate monthly data for chart
        const monthlyMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(m => monthlyMap[m] = 0);

        invoices.forEach(inv => {
          if (inv.created_at) {
            const date = new Date(inv.created_at);
            if (date.getFullYear() === new Date().getFullYear()) {
              const monthName = months[date.getMonth()];
              if (monthName) {
                monthlyMap[monthName] += (parseFloat(inv.grand_total) || 0);
              }
            }
          }
        });

        monthlyData = months.map(name => ({ name, value: monthlyMap[name] }));
      }

      setAnalytics({
        mrr,
        activePlans,
        trialUsers,
        conversionRate,
        emailUsage,
        planDistribution,
        totalRevenue,
        totalInvoices,
        avgInvoiceValue,
        recentInvoices,
        monthlyData
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
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
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Track your subscription metrics, invoices, and performance</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* MRR Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Recurring Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(analytics.mrr, 'INR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Estimated MRR</p>
            </CardContent>
          </Card>

          {/* Active Plans Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {analytics.activePlans.pro + analytics.activePlans.enterprise}
              </div>
              <p className="text-xs text-gray-500 mt-1">Paid subscriptions</p>
            </CardContent>
          </Card>

          {/* Trial Users Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Trial Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {analytics.trialUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active trials</p>
            </CardContent>
          </Card>

          {/* Conversion Rate Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {analytics.conversionRate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Trial to paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Email Usage & Plan Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Email Usage Trends */}
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
                        analytics.emailUsage.percentage >= 70 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(analytics.emailUsage.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {analytics.emailUsage.percentage}% of limit used
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600 mb-2">Usage Status</div>
                  {analytics.emailUsage.percentage >= 90 ? (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                      ⚠️ Approaching limit - Consider upgrading
                    </div>
                  ) : analytics.emailUsage.percentage >= 70 ? (
                    <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-sm">
                      📊 Moderate usage - Monitor closely
                    </div>
                  ) : (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                      ✅ Healthy usage - Within limits
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-600" />
                Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.planDistribution.map((plan, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{plan.name}</span>
                      <span className="text-gray-600">{plan.value} users</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(plan.value / analytics.planDistribution.reduce((sum, p) => sum + p.value, 0)) * 100}%`,
                          backgroundColor: plan.color
                        }}
                      />
                    </div>
                  </div>
                ))}

                {analytics.planDistribution.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active subscriptions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Invoice Statistics</h2>
          
          {/* Invoice KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue, 'INR')}</div>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> 
                  From all invoices
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Invoices Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalInvoices}</div>
                <p className="text-xs text-gray-500 mt-1">Documents created</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Average Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.avgInvoiceValue, 'INR')}</div>
                <p className="text-xs text-gray-500 mt-1">Per invoice</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Chart & Recent Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Recent Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentInvoices.length > 0 ? (
                    analytics.recentInvoices.map((inv) => (
                      <div 
                        key={inv.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer" 
                        onClick={() => navigate('/invoice-history')}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {inv.customer_name || inv.bill_to?.name || 'Unknown Client'}
                          </span>
                          <span className="text-xs text-gray-500">#{inv.invoice_number}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-indigo-600">
                            {formatCurrency(inv.grand_total, 'INR')}
                          </span>
                          <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No invoices yet</p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Button variant="outline" className="w-full" onClick={() => navigate('/invoice-history')}>
                    View All History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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

export default Analytics;
