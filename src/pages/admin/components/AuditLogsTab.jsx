import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { User, Activity, History, ShieldAlert, Search, Filter, Calendar } from 'lucide-react';
import TablePagination from './TablePagination';

const AuditLogsTab = ({ logs }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const pageSize = 15;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        (log.user_profile?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || 
        (log.action && log.action.toLowerCase().includes(actionFilter.toLowerCase()));
      
      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionBadge = (action) => {
    const a = action?.toLowerCase() || '';
    if (a.includes('security') || a.includes('auth')) return 'bg-red-100 text-red-700 border-red-200';
    if (a.includes('payment') || a.includes('subscription')) return 'bg-green-100 text-green-700 border-green-200';
    if (a.includes('admin')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Event Stream
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search email, action, details..." 
                  className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-sm bg-gray-50 border-gray-200">
                  <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="auth">Auth & Security</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="subscription">Subscriptions</SelectItem>
                  <SelectItem value="admin">Admin Actions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Operation</th>
                <th className="px-6 py-4">Payload Hint</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-gray-50 rounded-full text-gray-300">
                        <Search className="h-8 w-8" />
                      </div>
                      <p className="text-gray-500 font-medium">No audit logs found matching your filters.</p>
                      <button 
                        onClick={() => { setSearchTerm(''); setActionFilter('all'); }}
                        className="text-indigo-600 text-xs font-bold hover:underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 group-hover:bg-white transition-colors border border-gray-100">
                        {log.action && (log.action.includes('SECURITY') || log.action.includes('ERROR')) ? (
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-indigo-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 leading-none mb-1">
                          {log.user_profile?.full_name || 'System Operator'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {log.user_profile?.email || 'SYSTEM_INTERNAL'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`px-2 py-0.5 text-[9px] uppercase font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[240px] truncate text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100" title={JSON.stringify(log.details)}>
                        {log.details ? JSON.stringify(log.details) : 'VOID'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-700">
                          {format(new Date(log.created_at), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="bg-gray-50/50 border-t">
            <TablePagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogsTab;
