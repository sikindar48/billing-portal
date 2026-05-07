import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatCurrency';

const UserAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    invoiceCount: 0,
    avgValue: 0,
    monthlyData: [],
    topCustomers: [],
    statusDistribution: { paid: 0, sent: 0, draft: 0, cancelled: 0 }
  });

  useEffect(() => {
    if (user) fetchUserAnalytics();
  }, [user]);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch all invoices for the user
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        setStats({
          totalCollected: 0,
          totalPending: 0,
          invoiceCount: 0,
          avgValue: 0,
          monthlyData: Array(12).fill(0).map((_, i) => ({ name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i], value: 0 })),
          topCustomers: [],
          statusDistribution: { paid: 0, sent: 0, draft: 0, cancelled: 0 }
        });
        return;
      }

      let collected = 0;
      let pending = 0;
      const statusDist = { paid: 0, sent: 0, draft: 0, cancelled: 0 };
      const customerMap = {};
      const monthlyMap = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(m => monthlyMap[m] = 0);

      invoices.forEach(inv => {
        const total = parseFloat(inv.grand_total) || 0;
        const status = (inv.invoice_details?.status || 'draft').toLowerCase();
        
        // Status counts
        if (statusDist.hasOwnProperty(status)) {
          statusDist[status]++;
        }

        // Revenue calculation
        if (status === 'paid') {
          collected += total;
        } else if (status === 'sent') {
          pending += total;
        }

        // Customer mapping for Top Customers
        const customerName = inv.customer_name || inv.bill_to?.name || 'Unknown Client';
        customerMap[customerName] = (customerMap[customerName] || 0) + total;

        // Monthly mapping for chart
        const date = new Date(inv.created_at);
        if (date.getFullYear() === new Date().getFullYear()) {
          const monthName = months[date.getMonth()];
          monthlyMap[monthName] += total;
        }
      });

      // Transform top customers
      const topCustomers = Object.entries(customerMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Transform monthly data
      const monthlyData = months.map(name => ({ name, value: monthlyMap[name] }));

      setStats({
        totalCollected: collected,
        totalPending: pending,
        invoiceCount: invoices.length,
        avgValue: invoices.length > 0 ? (collected + pending) / invoices.length : 0,
        monthlyData,
        topCustomers,
        statusDistribution: statusDist
      });

    } catch (err) {
      console.error('Error fetching user analytics:', err);
      toast.error('Failed to load dashboard data');
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
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Revenue Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time overview of your business performance</p>
          </div>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          >
            Create New Invoice
          </Button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Collected" 
            value={formatCurrency(stats.totalCollected, 'INR')} 
            subtitle="Successfully paid"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            color="border-l-emerald-500"
            trend={<span className="text-emerald-600 flex items-center text-xs font-medium"><ArrowUpRight className="h-3 w-3 mr-1" /> All time</span>}
          />
          <StatCard 
            title="Pending Revenue" 
            value={formatCurrency(stats.totalPending, 'INR')} 
            subtitle="Sent to clients"
            icon={<Clock className="h-5 w-5 text-orange-600" />}
            color="border-l-orange-500"
            trend={<span className="text-orange-600 flex items-center text-xs font-medium">Awaiting payment</span>}
          />
          <StatCard 
            title="Avg. Invoice" 
            value={formatCurrency(stats.avgValue, 'INR')} 
            subtitle="Mean transaction"
            icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
            color="border-l-indigo-500"
          />
          <StatCard 
            title="Total Documents" 
            value={stats.invoiceCount} 
            subtitle="Invoices generated"
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            color="border-l-blue-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Monthly Revenue Chart */}
          <Card className="lg:col-span-2 shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Monthly Revenue Growth
              </CardTitle>
              <Select defaultValue="2026">
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <SimpleBarChart data={stats.monthlyData} />
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.topCustomers.length > 0 ? (
                  stats.topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">{customer.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Customer</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(customer.value, 'INR')}</div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1">
                          <div 
                            className="h-1.5 bg-indigo-500 rounded-full" 
                            style={{ width: `${(customer.value / stats.topCustomers[0].value) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No customer data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Invoice Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatusItem label="Paid" count={stats.statusDistribution.paid} color="bg-emerald-500" total={stats.invoiceCount} />
                <StatusItem label="Sent" count={stats.statusDistribution.sent} color="bg-blue-500" total={stats.invoiceCount} />
                <StatusItem label="Draft" count={stats.statusDistribution.draft} color="bg-slate-400" total={stats.invoiceCount} />
                <StatusItem label="Cancelled" count={stats.statusDistribution.cancelled} color="bg-red-400" total={stats.invoiceCount} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Tips */}
          <Card className="shadow-sm border-gray-200 bg-indigo-900 text-white">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-800 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Scale Your Business</h3>
                  <p className="text-indigo-200 text-sm mb-4">
                    Track your collections in real-time and identify your most valuable customers to grow faster.
                  </p>
                  <Button 
                    variant="link" 
                    className="text-white p-0 h-auto font-bold hover:no-underline flex items-center gap-1"
                    onClick={() => navigate('/invoice-history')}
                  >
                    Manage Invoices <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

// Sub-components
const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
  <Card className={`shadow-sm border-gray-200 border-l-4 ${color}`}>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {trend}
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900 tracking-tight">{value}</div>
        <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-tighter">{title}</p>
        <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>
      </div>
    </CardContent>
  </Card>
);

const StatusItem = ({ label, count, color, total }) => (
  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
    </div>
    <div className="text-xl font-bold text-gray-900">{count}</div>
    <div className="text-[10px] text-gray-400 mt-1">{total > 0 ? ((count/total)*100).toFixed(0) : 0}% of total</div>
  </div>
);

const SimpleBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1000);
  
  return (
    <div className="w-full h-full flex items-end justify-around gap-2 px-2">
      {data.map((item, index) => {
        const height = (item.value / maxValue) * 100;
        return (
          <div key={index} className="flex flex-col items-center flex-1 group relative h-full justify-end">
            <div 
              className="w-full bg-indigo-500/10 rounded-t-lg group-hover:bg-indigo-500/20 transition-all absolute bottom-0"
              style={{ height: '100%' }}
            />
            <div 
              className="w-full bg-indigo-600 rounded-t-lg hover:bg-indigo-700 transition-all relative z-10 shadow-lg shadow-indigo-100"
              style={{ height: `${Math.max(height, 2)}%` }}
            >
              {item.value > 0 && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                  {formatCurrency(item.value, 'INR')}
                </div>
              )}
            </div>
            <div className="text-[10px] font-bold text-gray-400 mt-3">{item.name}</div>
          </div>
        );
      })}
    </div>
  );
};

export default UserAnalytics;
