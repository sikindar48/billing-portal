import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  IndianRupee, Clock, CreditCard, CheckCircle2,
  XCircle, Hourglass, Search
} from 'lucide-react';
import TablePagination from './TablePagination';

const STATUS_CONFIG = {
  captured: {
    label: 'Captured',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    cls: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
    Icon: XCircle,
  },
  pending: {
    label: 'Pending',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    Icon: Hourglass,
  },
};

const getStatus = (status) =>
  STATUS_CONFIG[status] || {
    label: status,
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
    Icon: Clock,
  };

const PaymentsTab = ({ payments }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const pageSize = 10;

  // Filter
  const filtered = payments.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (p.order_id || '').toLowerCase().includes(q) ||
      (p.payment_id || '').toLowerCase().includes(q) ||
      (p.user_email || '').toLowerCase().includes(q) ||
      (p.plan_slug || '').toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' ? (p.status !== 'captured' && p.status !== 'failed') : p.status === statusFilter);
    return matchSearch && matchStatus;
  });

  const totalPages        = Math.ceil(filtered.length / pageSize);
  const paginatedPayments = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID, email, plan…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select
          className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 cursor-pointer"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="captured">Captured</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <p className="text-[11px] text-gray-400 font-medium px-0.5">
        Showing <span className="font-bold text-gray-600">{filtered.length}</span> of {payments.length} payments
      </p>

      {/* ── Table ── */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Order / Payment ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="p-4 bg-gray-100 rounded-2xl">
                        <CreditCard className="h-8 w-8 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500">No payment records found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {payments.length === 0
                            ? 'Payments will appear here once transactions are processed.'
                            : 'Try adjusting your search or filter.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.map((p) => {
                const s = getStatus(p.status);
                return (
                  <tr key={p.order_id} className="hover:bg-indigo-50/30 transition-colors group">
                    {/* Order / Payment ID */}
                    <td className="px-5 py-4 font-mono">
                      <div className="text-[12px] font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                        {p.order_id}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {p.payment_id || <span className="italic text-gray-300">awaiting payment</span>}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 text-sm">{p.user_email}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                        {p.plan_slug}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 font-bold text-gray-900 text-sm">
                        <IndianRupee className="h-3.5 w-3.5 text-gray-500" />
                        {p.amount}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-0.5 ${s.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="text-[12px] font-semibold text-gray-700">
                        {format(new Date(p.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {format(new Date(p.created_at), 'HH:mm')}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>
    </div>
  );
};

export default PaymentsTab;
