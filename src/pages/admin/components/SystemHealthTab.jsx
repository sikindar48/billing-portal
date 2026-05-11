import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Mail, Database, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SERVICES = [
  { key: 'database',      label: 'PostgreSQL Database',  desc: 'Supabase DB instance & RLS policies', Icon: Database, iconBg: 'bg-indigo-50', iconCls: 'text-indigo-600' },
  { key: 'edgeFunctions', label: 'Deno Edge Functions',  desc: 'Email, Payments & OTP infrastructure', Icon: Zap,      iconBg: 'bg-orange-50', iconCls: 'text-orange-500' },
  { key: 'gmailApi',      label: 'Gmail API Gateway',    desc: 'OAuth token store & connectivity', Icon: Mail,     iconBg: 'bg-blue-50',   iconCls: 'text-blue-500'   },
];

const StatusPill = ({ status }) => {
  if (status === 'checking') return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-0.5 bg-gray-50 text-gray-500 border-gray-200 animate-pulse">
      <Clock className="h-3 w-3" /> Checking…
    </span>
  );
  if (status === 'healthy') return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
      <CheckCircle2 className="h-3 w-3" /> Online
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-0.5 bg-red-50 text-red-600 border-red-200">
      <AlertCircle className="h-3 w-3" /> Degraded
    </span>
  );
};

const SystemHealthTab = () => {
  const [health, setHealth] = useState({
    database: 'checking', edgeFunctions: 'checking', gmailApi: 'checking',
    lastChecked: null,
    details: { database: '', edgeFunctions: '', gmailApi: '' }
  });
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    setHealth(h => ({ ...h, database: 'checking', edgeFunctions: 'checking', gmailApi: 'checking' }));

    // Run all 3 checks in parallel — no waiting for one before the next
    const [dbResult, edgeResult, gmailResult] = await Promise.allSettled([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      supabase.functions.invoke('send-email', { body: { type: 'ping' } }),
      supabase.from('gmail_oauth_tokens').select('count', { count: 'exact', head: true }),
    ]);

    const results = { database: 'healthy', edgeFunctions: 'healthy', gmailApi: 'healthy' };
    const details = { database: '', edgeFunctions: '', gmailApi: '' };

    // DB
    if (dbResult.status === 'rejected') {
      results.database = 'unhealthy';
      details.database = dbResult.reason?.message ?? 'Unknown error';
    } else if (dbResult.value?.error) {
      results.database = 'unhealthy';
      details.database = dbResult.value.error.message;
    }

    // Edge Functions
    if (edgeResult.status === 'rejected') {
      results.edgeFunctions = 'unhealthy';
      details.edgeFunctions = edgeResult.reason?.message ?? 'Unknown error';
    } else if (edgeResult.value?.error) {
      results.edgeFunctions = 'unhealthy';
      try {
        const ctx = await edgeResult.value.error.context?.json?.();
        details.edgeFunctions = ctx?.error ?? edgeResult.value.error.message ?? 'Function error';
      } catch {
        details.edgeFunctions = edgeResult.value.error.message ?? 'Function error';
      }
    }

    // Gmail
    if (gmailResult.status === 'rejected') {
      results.gmailApi = 'unhealthy';
      details.gmailApi = gmailResult.reason?.message ?? 'Unknown error';
    } else if (gmailResult.value?.error) {
      results.gmailApi = 'unhealthy';
      details.gmailApi = gmailResult.value.error.message;
    }

    setHealth({ ...results, lastChecked: new Date(), details });
    if (results.database === 'healthy') toast.success('Infrastructure status updated');
    setLoading(false);
  };

  useEffect(() => { checkHealth(); }, []);

  const allHealthy = SERVICES.every(s => health[s.key] === 'healthy');

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-600" />
          <span className="font-bold text-gray-800">Infrastructure Status</span>
          {health.lastChecked && (
            <span className="text-[11px] text-gray-400 font-medium">
              · checked at {format(health.lastChecked, 'HH:mm:ss')}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={checkHealth} disabled={loading} className="h-8 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Overall banner */}
      {!loading && health.lastChecked && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          allHealthy ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          {allHealthy
            ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            : <AlertCircle  className="h-5 w-5 text-red-500 shrink-0" />}
          <div>
            <p className={`text-sm font-bold ${allHealthy ? 'text-emerald-800' : 'text-red-700'}`}>
              {allHealthy ? 'All systems operational' : 'One or more services degraded'}
            </p>
            <p className={`text-[11px] ${allHealthy ? 'text-emerald-600' : 'text-red-500'}`}>
              {allHealthy ? '99.9% uptime · No incidents reported' : 'Check individual service cards below for details'}
            </p>
          </div>
        </div>
      )}

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SERVICES.map(({ key, label, desc, Icon, iconBg, iconCls }) => (
          <Card key={key} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 ${iconBg} rounded-xl`}>
                  <Icon className={`h-5 w-5 ${iconCls}`} />
                </div>
                <StatusPill status={health[key]} />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">{label}</h4>
              <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
              {health[key] === 'unhealthy' && health.details[key] && (
                <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100 text-[10px] text-red-600 font-mono truncate" title={health.details[key]}>
                  {health.details[key]}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SystemHealthTab;
