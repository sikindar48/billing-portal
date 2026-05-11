import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Activity, History, ShieldAlert, Search, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import TablePagination from './TablePagination';

const ACTION_STYLES = {
  security: 'bg-red-50 text-red-700 border-red-200',
  auth:     'bg-red-50 text-red-700 border-red-200',
  payment:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  subscription: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  admin:    'bg-purple-50 text-purple-700 border-purple-200',
};

const getActionStyle = (action_type = '') => {
  const a = action_type.toLowerCase();
  for (const [key, cls] of Object.entries(ACTION_STYLES)) {
    if (a.includes(key)) return cls;
  }
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

const AuditLogsTab = ({ logs = [], loading = false, error = null, onRetry = null }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm]   = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const pageSize = 15;

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-red-700">Failed to load audit logs</p>
          <p className="text-[12px] text-red-600 mt-0.5">{error}</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0">
            Retry
          </Button>
        )}
      </div>
    );
  }

  const filtered = useMemo(() => (logs || []).filter(log => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (log.user_profile?.email || '').toLowerCase().includes(q) ||
      (log.user_profile?.full_name || '').toLowerCase().includes(q) ||
      (log.action_type || '').toLowerCase().includes(q) ||
      JSON.stringify(log.details || '').toLowerCase().includes(q);
    const matchAction = actionFilter === 'all' || (log.action_type || '').toLowerCase().includes(actionFilter);
    return matchSearch && matchAction;
  }), [logs, searchTerm, actionFilter]);

  const totalPages  = Math.ceil(filtered.length / pageSize);
  const paginated   = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const isAlert = (a = '') => a.toLowerCase().includes('security') || a.toLowerCase().includes('error');

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search email, action, details…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 cursor-pointer"
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Actions</option>
            <option value="auth">Auth & Security</option>
            <option value="payment">Payments</option>
            <option value="subscription">Subscriptions</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <p className="text-[11px] text-gray-400 font-medium px-0.5">
        Showing <span className="font-bold text-gray-600">{filtered.length}</span> of {logs.length} events
      </p>

      {/* Table */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3 w-10"></th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <History className="h-8 w-8 text-gray-200" />
                      <p className="text-sm font-medium">No events match your filters.</p>
                      {(searchTerm || actionFilter !== 'all') && (
                        <button onClick={() => { setSearchTerm(''); setActionFilter('all'); }} className="text-indigo-500 text-xs font-bold hover:underline">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paginated.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="h-7 w-7 rounded-lg bg-gray-50 border border-gray-100 group-hover:bg-white flex items-center justify-center transition-colors">
                      {isAlert(log.action_type)
                        ? <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                        : <Activity className="h-3.5 w-3.5 text-indigo-400" />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-gray-900 text-sm leading-none">{log.user_profile?.full_name || 'System'}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{log.user_profile?.email || 'INTERNAL'}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${getActionStyle(log.action_type)}`}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-[220px]">
                    <span className="block truncate text-[11px] font-mono text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-0.5" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : <span className="text-gray-300 not-italic">—</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="text-[12px] font-semibold text-gray-700">{format(new Date(log.created_at), 'MMM d, yyyy')}</div>
                    <div className="text-[11px] text-gray-400">{format(new Date(log.created_at), 'HH:mm:ss')}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>
    </div>
  );
};

export default AuditLogsTab;
