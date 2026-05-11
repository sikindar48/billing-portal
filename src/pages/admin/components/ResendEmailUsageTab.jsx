import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mail, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DEFAULT_LIMIT = 3000;

const ResendEmailUsageTab = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_resend_email_stats');
      if (error) throw error;
      setStats(data || null);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load Resend usage (run migration 20260512?)');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const limit = stats?.monthly_limit ?? DEFAULT_LIMIT;
  const total = Number(stats?.total_this_month ?? 0);
  const remaining = Number(stats?.remaining_approx ?? Math.max(0, limit - total));
  const pct = limit > 0 ? Math.min(100, Math.round((total / limit) * 1000) / 10) : 0;
  const byType = stats?.by_type && typeof stats.by_type === 'object' ? stats.by_type : {};
  const last50 = Array.isArray(stats?.last_50) ? stats.last_50 : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            Resend (platform transactional mail)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Counts successful sends from the <code className="text-xs bg-gray-100 px-1 rounded">send-email</code> Edge
            Function (welcome, OTP, subscription confirmation, default-mail invoices). Gmail sends are not counted here.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {pct >= 85 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Approaching monthly Resend quota</p>
            <p className="text-amber-800/90 mt-1">
              Update <span className="font-mono">monthly_limit</span> in <span className="font-mono">get_admin_resend_email_stats</span> if
              your Resend plan changes. Consider upgrading Resend or shifting more invoice volume to Gmail (Pro).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">This month (approx.)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.month_start_utc
                ? `${format(new Date(stats.month_start_utc), 'MMM d')} – window from DB month_trunc`
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Budget (reference)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">{limit.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Editable in RPC migration</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Remaining (approx.)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{remaining.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">max(0, limit − sends)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage vs limit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={pct} className="h-3" />
          <p className="text-sm text-gray-600">
            {pct}% of reference limit ({total.toLocaleString()} / {limit.toLocaleString()})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By email type (this month)</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(byType).length === 0 ? (
            <p className="text-sm text-gray-500">No sends recorded yet this month.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {Object.entries(byType).map(([k, v]) => (
                <li key={k} className="flex justify-between px-4 py-2 text-sm">
                  <span className="font-mono text-gray-700">{k}</span>
                  <span className="font-semibold">{String(v)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent sends (last 50)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {last50.length === 0 ? (
            <p className="text-sm text-gray-500">No rows yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2">Resend ID</th>
                </tr>
              </thead>
              <tbody>
                {last50.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {row.created_at ? format(new Date(row.created_at), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{row.email_type}</td>
                    <td className="py-2 pr-4 font-mono text-xs truncate max-w-[120px]">{row.user_id || '—'}</td>
                    <td className="py-2 font-mono text-xs truncate max-w-[180px]">{row.resend_message_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResendEmailUsageTab;
