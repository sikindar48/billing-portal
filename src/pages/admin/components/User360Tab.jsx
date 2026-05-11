import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, User, Calendar, ShieldCheck, Building, Settings2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import TablePagination from './TablePagination';

const PLAN_STYLES = {
  pro:        'bg-indigo-50 text-indigo-700 border-indigo-200',
  monthly:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  yearly:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial:      'bg-amber-50 text-amber-700 border-amber-200',
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
  expired:    'bg-red-50 text-red-600 border-red-200',
};

const User360Tab = ({ users, onRefresh, searchTerm = '' }) => {
  const [currentPage, setCurrentPage]         = useState(1);
  const [sortCol, setSortCol]                 = useState('created');
  const [sortDir, setSortDir]                 = useState('desc');
  const [selectedUser, setSelectedUser]       = useState(null);
  const [isOverrideOpen, setIsOverrideOpen]   = useState(false);
  const [isBrandingOpen, setIsBrandingOpen]   = useState(false);
  const [processing, setProcessing]           = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const pageSize = 10;

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="inline h-3 w-3 ml-1 text-indigo-500" />
      : <ChevronDown className="inline h-3 w-3 ml-1 text-indigo-500" />;
  };

  const filtered = users
    .filter(u => {
      const q = searchTerm.toLowerCase();
      return u.out_email.toLowerCase().includes(q) ||
        u.out_company_name?.toLowerCase().includes(q) ||
        u.out_full_name?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'plan')     return dir * (a.out_plan_slug || 'free').localeCompare(b.out_plan_slug || 'free');
      if (sortCol === 'expiry')   return dir * (new Date(a.out_period_end || 0) - new Date(b.out_period_end || 0));
      if (sortCol === 'invoices') return dir * (a.out_invoice_count - b.out_invoice_count);
      if (sortCol === 'active')   return dir * (new Date(a.out_last_active || 0) - new Date(b.out_last_active || 0));
      // default: created
      return dir * (new Date(a.out_created_at) - new Date(b.out_created_at));
    });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOverride = async (userId, action) => {
    setProcessing(true);
    setProcessingAction(action);
    try {
      const { data, error } = await supabase.rpc('admin_override_subscription', { p_user_id: userId, p_action: action });
      if (error) throw error;
      toast.success(data.message);
      setIsOverrideOpen(false);
      onRefresh();
    } catch (err) {
      toast.error('Override failed: ' + err.message);
    } finally {
      setProcessing(false);
      setProcessingAction(null);
    }
  };

  const openOverride  = (user) => { setSelectedUser(user); setIsOverrideOpen(true); };
  const openBranding  = (user) => { setSelectedUser(user); setIsBrandingOpen(true); };

  return (
    <div className="space-y-3">

      {/* Count */}
      <p className="text-[11px] text-gray-400 font-medium px-0.5">
        Showing <span className="font-bold text-gray-600">{filtered.length}</span> of {users.length} users
      </p>

      {/* ── Table ── */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-600 transition-colors" onClick={() => handleSort('plan')}>
                  Plan <SortIcon col="plan" />
                </th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-600 transition-colors" onClick={() => handleSort('expiry')}>
                  Expiry <SortIcon col="expiry" />
                </th>
                <th className="px-5 py-3 text-center cursor-pointer select-none hover:text-gray-600 transition-colors" onClick={() => handleSort('invoices')}>
                  Invoices <SortIcon col="invoices" />
                </th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-600 transition-colors" onClick={() => handleSort('active')}>
                  Last Active <SortIcon col="active" />
                </th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center text-gray-400 text-sm">
                    No users match your filters.
                  </td>
                </tr>
              ) : paginated.map(user => {
                const planKey = (user.out_plan_slug || 'free').toLowerCase();
                const planStyle = PLAN_STYLES[planKey] || 'bg-gray-50 text-gray-600 border-gray-200';
                const expiry = user.out_period_end
                  ? format(new Date(user.out_period_end), 'MMM d, yyyy')
                  : user.out_created_at
                    ? format(new Date(new Date(user.out_created_at).getTime() + 3 * 86400000), 'MMM d, yyyy')
                    : '—';

                return (
                  <tr key={user.out_profile_id} className="hover:bg-gray-50/60 transition-colors">
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center overflow-hidden shrink-0">
                          {user.out_logo_url
                            ? <img src={user.out_logo_url} alt="" className="h-full w-full object-cover" />
                            : <User className="h-4 w-4 text-indigo-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{user.out_full_name || 'No Name'}</div>
                          <div className="text-[11px] text-gray-400 truncate">{user.out_email}</div>
                          {user.out_company_name && (
                            <div className="text-[11px] text-indigo-500 font-medium truncate">{user.out_company_name}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${planStyle}`}>
                        {user.out_plan_slug || 'free'}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {expiry === '—'
                        ? <span className="text-gray-300 font-medium text-sm">—</span>
                        : <span className="text-[12px] font-semibold text-gray-600">{expiry}</span>}
                    </td>

                    {/* Invoices */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-md text-xs font-bold ${
                        user.out_invoice_count > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
                      }`}>{user.out_invoice_count}</span>
                    </td>

                    {/* Last Active */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {user.out_last_active
                        ? <span className="text-[12px] text-gray-500">{format(new Date(user.out_last_active), 'MMM d, HH:mm')}</span>
                        : <span className="text-gray-300 font-medium text-sm">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          title="View Profile"
                          onClick={() => openBranding(user)}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50"
                          title="Manual Override"
                          onClick={() => openOverride(user)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
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

      {/* ── Override Dialog ── */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Administrative Override</DialogTitle>
            <DialogDescription>Modify subscription for <strong>{selectedUser?.out_email}</strong></DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {[
              { action: 'extend_trial', Icon: Calendar, iconCls: 'text-blue-500', label: 'Extend Trial', desc: 'Add 7 days to the current trial period.' },
              { action: 'activate_pro', Icon: ShieldCheck, iconCls: 'text-emerald-500', label: 'Activate Pro (1 Month)', desc: 'Manually grant full Pro features immediately.' },
              { action: 'cancel', Icon: Trash2, iconCls: 'text-red-500', label: 'Cancel / Remove Pro', desc: 'Revert user to Free plan and remove features.', danger: true },
            ].map(({ action, Icon, iconCls, label, desc, danger }) => (
              <button
                key={action}
                disabled={processing}
                onClick={() => handleOverride(selectedUser.out_profile_id, action)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors disabled:opacity-50
                  ${danger
                    ? 'border-red-100 hover:bg-red-50 hover:border-red-200'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
              >
                <div className={`shrink-0 ${iconCls}`}>
                  {processingAction === action
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Icon className="h-5 w-5" />}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${danger ? 'text-red-600' : 'text-gray-800'}`}>{label}</div>
                  <div className={`text-xs mt-0.5 ${danger ? 'text-red-400' : 'text-gray-400'}`}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Branding Dialog ── */}
      <Dialog open={isBrandingOpen} onOpenChange={setIsBrandingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile & Branding</DialogTitle>
            <DialogDescription>Quick view of this user's account details.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                {selectedUser.out_logo_url
                  ? <img src={selectedUser.out_logo_url} alt="Logo" className="h-14 w-14 object-contain bg-white p-1.5 rounded-lg border" />
                  : <div className="h-14 w-14 rounded-lg border bg-white flex items-center justify-center text-gray-300"><Building className="h-7 w-7" /></div>}
                <div>
                  <div className="font-bold text-gray-900">{selectedUser.out_company_name || 'No company'}</div>
                  <div className="text-sm text-gray-500">{selectedUser.out_email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Plan', value: (selectedUser.out_plan_slug || 'free').toUpperCase() },
                  { label: 'Invoices', value: `${selectedUser.out_invoice_count} total` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default User360Tab;
