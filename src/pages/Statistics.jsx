import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Use relative paths to prevent build errors
import { supabase } from '../integrations/supabase/client';
import Navigation from '../components/Navigation';
import { formatCurrency } from '../utils/formatCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, TrendingUp, FileText, CreditCard, Calendar, ArrowUpRight, BarChart3, ArrowLeft } from 'lucide-react';

const Statistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    avgInvoiceValue: 0,
    recentInvoices: [],
    monthlyData: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch invoices with necessary fields
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, grand_total, created_at, bill_to')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        setLoading(false);
        return;
      }

      // 1. Calculate KPIs
      // Ensure grand_total is treated as a number
      const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.grand_total) || 0), 0);
      const totalInvoices = invoices.length;
      const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      // 2. Calculate Monthly Data for Chart
      const monthlyMap = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize 0 for all months
      months.forEach(m => monthlyMap[m] = 0);

      invoices.forEach(inv => {
        if (inv.created_at) {
            const date = new Date(inv.created_at);
            // Only count current year for chart simplicity
            if (date.getFullYear() === new Date().getFullYear()) {
                const monthName = months[date.getMonth()];
                if (monthName) {
                    monthlyMap[monthName] += (parseFloat(inv.grand_total) || 0);
                }
            }
        }
      });

      const monthlyData = months.map(name => ({ name, value: monthlyMap[name] }));

      setMetrics({
        totalRevenue,
        totalInvoices,
        avgInvoiceValue,
        recentInvoices: invoices.slice(0, 5), // Top 5 recent
        monthlyData
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom Simple Bar Chart Component (SVG)
  const SimpleBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 100); // Avoid division by zero
    const height = 150;
    
    return (
      <div className="flex items-end justify-between h-[150px] w-full gap-2 pt-4">
        {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * height;
            return (
                <div key={index} className="flex flex-col items-center justify-end group w-full">
                    <div className="relative w-full flex justify-center">
                         {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                            {formatCurrency(item.value, 'INR')}
                        </div>
                        {/* Bar */}
                        <div 
                            style={{ height: `${Math.max(barHeight, 4)}px` }} 
                            className={`w-3/4 max-w-[20px] rounded-t-sm transition-all duration-500 ${item.value > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-gray-100'}`}
                        ></div>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-2 font-medium">{item.name}</span>
                </div>
            );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                 <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 pl-0 hover:bg-transparent hover:text-indigo-600">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                 </Button>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Business Insights</h1>
                <p className="text-gray-500 mt-1 text-sm">Overview of your financial performance.</p>
            </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Revenue</CardTitle>
                    <div className="p-2 bg-indigo-50 rounded-full"><CreditCard className="h-4 w-4 text-indigo-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue, 'INR')}</div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> 
                        <span className="text-green-600 font-medium">Lifetime</span>
                    </p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Invoices Generated</CardTitle>
                    <div className="p-2 bg-blue-50 rounded-full"><FileText className="h-4 w-4 text-blue-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{metrics.totalInvoices}</div>
                    <p className="text-xs text-gray-500 mt-1">Documents created</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg. Deal Size</CardTitle>
                    <div className="p-2 bg-green-50 rounded-full"><TrendingUp className="h-4 w-4 text-green-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.avgInvoiceValue, 'INR')}</div>
                    <p className="text-xs text-gray-500 mt-1">Per invoice</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2">
                <Card className="shadow-sm h-full border-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                            <BarChart3 className="h-5 w-5 text-indigo-600" /> 
                            Revenue Trends ({new Date().getFullYear()})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full flex items-end justify-center pb-2">
                            {metrics.totalRevenue > 0 ? (
                                <SimpleBarChart data={metrics.monthlyData} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                                    <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                                    No data available yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <div className="lg:col-span-1">
                <Card className="shadow-sm h-full border-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                            <Calendar className="h-5 w-5 text-indigo-600" /> 
                            Recent Invoices
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.recentInvoices.length > 0 ? (
                                metrics.recentInvoices.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => navigate('/invoice-history')}>
                                        <div className="flex flex-col">
                                            {/* Handle potential undefined bill_to structure safely */}
                                            <span className="text-sm font-bold text-gray-800">
                                                {inv.bill_to?.name || 'Unknown Client'}
                                            </span>
                                            <span className="text-xs text-gray-500">#{inv.invoice_number}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-indigo-600">{formatCurrency(inv.grand_total, 'INR')}</span>
                                            <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">No recent transactions</p>
                            )}
                        </div>
                        <div className="mt-6">
                            <Button variant="outline" className="w-full" onClick={() => navigate('/invoice-history')}>View All History</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;