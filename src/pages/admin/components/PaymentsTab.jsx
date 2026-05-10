import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { IndianRupee, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TablePagination from './TablePagination';

const PaymentsTab = ({ payments }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(payments.length / pageSize);
  const paginatedPayments = payments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Order / Payment ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                    No payment records found yet.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => (
                  <tr key={p.order_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px]">
                      <div className="text-gray-900 font-bold">{p.order_id}</div>
                      <div className="text-gray-400">{p.payment_id || 'Waiting for payment...'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{p.user_email}</div>
                      <Badge variant="outline" className="text-[10px] uppercase">{p.plan_slug}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-gray-800">
                        <IndianRupee className="h-3 w-3" /> {p.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'captured' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Captured
                        </Badge>
                      ) : p.status === 'failed' ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                          <AlertCircle className="h-3 w-3" /> Failed
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
                          <Clock className="h-3 w-3" /> {p.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {format(new Date(p.created_at), 'MMM dd, yyyy HH:mm:ss')}
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

export default PaymentsTab;
