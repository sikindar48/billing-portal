import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, Filter, Calendar, User, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 20;

const AuditLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filters
  const [identityFilter, setIdentityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, identityFilter, actionFilter, dateFilter]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          user_identity_type,
          action_type,
          resource_type,
          resource_id,
          details,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Fetch last 500 logs

      if (error) {
        // If table doesn't exist or schema cache issue, show empty state
        if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('schema cache'))) {
          console.warn('Audit logs table not accessible:', error.message);
          console.info('To fix: Run NOTIFY pgrst, \'reload schema\'; in Supabase SQL Editor');
          setLogs([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs: ' + (error.message || 'Unknown error'));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Identity type filter
    if (identityFilter !== 'all') {
      filtered = filtered.filter(log => log.user_identity_type === identityFilter);
    }

    // Action type filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(log => new Date(log.created_at) >= filterDate);
      }
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getActionBadge = (action) => {
    const config = {
      'invoice_created': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Created' },
      'invoice_updated': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Updated' },
      'invoice_deleted': { color: 'bg-red-100 text-red-700 border-red-200', label: 'Deleted' },
      'payment_recorded': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Payment' },
      'status_changed': { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Status' },
      'email_sent': { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Email' },
      'subscription_changed': { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Subscription' }
    };

    const style = config[action] || { color: 'bg-gray-100 text-gray-700 border-gray-200', label: action };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style.color}`}>
        {style.label}
      </span>
    );
  };

  const getIdentityBadge = (identity) => {
    const config = {
      'user': { color: 'bg-blue-50 text-blue-700', icon: User },
      'admin': { color: 'bg-red-50 text-red-700', icon: Shield },
      'system': { color: 'bg-gray-50 text-gray-700', icon: Activity }
    };

    const style = config[identity] || config.system;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${style.color}`}>
        <Icon className="h-3 w-3" />
        {identity}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Get unique values for filters
  const uniqueIdentities = [...new Set(logs.map(log => log.user_identity_type))];
  const uniqueActions = [...new Set(logs.map(log => log.action_type))];

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
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-indigo-600" />
              Audit Logs
            </h1>
            <p className="text-gray-500 text-sm mt-1">Track all system activities and changes</p>
          </div>
          
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Identity Type</label>
                <Select value={identityFilter} onValueChange={setIdentityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Identities</SelectItem>
                    {uniqueIdentities.map(identity => (
                      <SelectItem key={identity} value={identity}>
                        {identity.charAt(0).toUpperCase() + identity.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Action Type</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing {currentLogs.length} of {filteredLogs.length} logs
              </span>
              {(identityFilter !== 'all' || actionFilter !== 'all' || dateFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIdentityFilter('all');
                    setActionFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Identity</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <div>
                            <div className="font-medium">{format(new Date(log.created_at), 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-gray-500">{format(new Date(log.created_at), 'HH:mm:ss')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getIdentityBadge(log.user_identity_type)}
                      </td>
                      <td className="px-6 py-4">
                        {getActionBadge(log.action_type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{log.resource_type || 'N/A'}</div>
                        {log.resource_id && (
                          <div className="text-xs text-gray-500 font-mono">{log.resource_id.substring(0, 8)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-gray-600 truncate" title={log.details}>
                          {log.details || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuditLogs;
