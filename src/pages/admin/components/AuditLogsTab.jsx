import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { User, Activity, History, ShieldAlert } from 'lucide-react';
import TablePagination from './TablePagination';

const AuditLogsTab = ({ logs }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(logs.length / pageSize);
  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                    No audit logs available.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 even:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      {log.action && (log.action.includes('SECURITY') || log.action.includes('ERROR')) ? (
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                      ) : (
                        <Activity className="h-5 w-5 text-indigo-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {log.user_profile?.full_name || log.user_profile?.email || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[10px]">{log.action}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details).substring(0, 50) : 'No details'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </Card>
    </div>
  );
};

export default AuditLogsTab;
