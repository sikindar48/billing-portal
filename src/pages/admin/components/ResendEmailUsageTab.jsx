import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, RefreshCw, AlertTriangle, TrendingUp, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DEFAULT_LIMIT = 3000;

const ResendEmailUsageTab = ({ prefetchedStats = null }) => {
  const [loading, setLoading] = useState(!prefetchedStats);
  const [stats, setStats]     = useState(prefetchedStats);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_resend_email_stats', {});
      if (error) throw error;
      setStats(data || null);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load Resend stats.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch on mount if we didn't get pre-fetched data
    if (!prefetchedStats) load();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const limit     = stats?.monthly_limit ?? DEFAULT_LIMIT;
  const total     = Number(stats?.total_this_month ?? 0);
  const remaining = Number(stats?.remaining_approx ?? Math.max(0, limit - total));
  const pct       = limit > 0 ? Math.min(100, Math.round((total / limit) * 1000) / 10) : 0;
  const byType    = stats?.by_type && typeof stats.by_type === 'object' ? stats.by_type : {};
  const last50    = Array.isArray(stats?.last_50) ? stats.last_50 : [];

  const barColor = pct >= 85 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo-600" />
          <span className="font-bold text-gray-800">Resend Email Usage</span>
          <span className="text-[11px] text-gray-400">· transactional mail via Edge Function</span>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Quota warning */}
      {pct >= 85 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Approaching monthly quota</p>
            <p className="text-[12px] text-amber-700 mt-0.5">Consider upgrading Resend or shifting invoice volume to Gmail (Pro users).</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Sent this month', value: total.toLocaleString(),     Icon: TrendingUp, iconBg: 'bg-indigo-50', iconCls: 'text-indigo-600', valCls: 'text-gray-900' },
          { label: 'Monthly Limit',  value: limit.toLocaleString(),     Icon: Mail,       iconBg: 'bg-gray-50',   iconCls: 'text-gray-500',   valCls: 'text-indigo-600' },
          { label: 'Remaining',       value: remaining.toLocaleString(), Icon: Inbox,      iconBg: 'bg-emerald-50',iconCls: 'text-emerald-600', valCls: 'text-emerald-600' },
        ].map(({ label, value, Icon, iconBg, iconCls, valCls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-bold mt-1.5 ${valCls}`}>{value}</p>
              </div>
              <div className={`p-2.5 ${iconBg} rounded-xl`}>
                <Icon className={`h-5 w-5 ${iconCls}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage bar */}
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Usage vs limit</span>
            <span className={`text-sm font-bold ${pct >= 85 ? 'text-red-600' : 'text-gray-700'}`}>{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">{total.toLocaleString()} of {limit.toLocaleString()} Emails used</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By type */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold text-gray-700">By email type</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {Object.keys(byType).length === 0 ? (
              <p className="text-sm text-gray-400">No Emails recorded yet this month.</p>
            ) : (
              <ul className="space-y-1">
                {Object.entries(byType).map(([k, v]) => (
                  <li key={k} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-[12px] font-mono text-gray-600">{k}</span>
                    <span className="text-[12px] font-bold text-gray-800 bg-gray-100 rounded px-2 py-0.5">{String(v)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent sends */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold text-gray-700">Recent Emails (last 50)</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 overflow-x-auto">
            {last50.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 pb-4">No rows yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-2">Time</th>
                    <th className="px-5 py-2">Type</th>
                    <th className="px-5 py-2">Resend ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {last50.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-2 text-[12px] text-gray-500 whitespace-nowrap">
                        {row.created_at ? format(new Date(row.created_at), 'MMM d, HH:mm') : '—'}
                      </td>
                      <td className="px-5 py-2 font-mono text-[11px] text-indigo-600">{row.email_type}</td>
                      <td className="px-5 py-2 font-mono text-[11px] text-gray-400 truncate max-w-[160px]">{row.resend_message_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResendEmailUsageTab;
