import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Search, User, ExternalLink, Calendar, ShieldCheck, Mail, Building, FileText, Settings2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import TablePagination from './TablePagination';

const User360Tab = ({ users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filter & Sort State
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setBy] = useState('newest');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredUsers = users
    .filter(u => {
      const matchesSearch = u.out_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.out_company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const userPlan = (u.out_plan_slug || 'free').toLowerCase();
      const filterValue = statusFilter.toLowerCase();
      
      // Smart matching: treat 'monthly' and 'pro' as the same for the filter
      const matchesStatus = filterValue === 'all' || 
                            userPlan === filterValue || 
                            (filterValue === 'pro' && userPlan === 'monthly') ||
                            (filterValue === 'monthly' && userPlan === 'pro');
                            
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.out_last_active).getTime() - new Date(a.out_last_active).getTime();
      if (sortBy === 'active') return new Date(b.out_last_active).getTime() - new Date(a.out_last_active).getTime();
      if (sortBy === 'invoices') return b.out_invoice_count - a.out_invoice_count;
      return 0;
    });

  // Paginated Users
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOverride = async (userId, action) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('admin_override_subscription', {
        p_user_id: userId,
        p_action: action
      });
      if (error) throw error;
      toast.success(data.message);
      setIsOverrideOpen(false);
      onRefresh();
    } catch (error) {
      toast.error('Override failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 w-full md:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search users or companies..." 
            className="pl-10 h-10 border-gray-100 bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="h-10 px-3 py-2 bg-gray-50/50 border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="trial">Trial</option>
            <option value="pro">Monthly Pro</option>
            <option value="yearly">Yearly Pro</option>
            <option value="free">Free / Basic</option>
            <option value="expired">Expired</option>
          </select>

          <select 
            className="h-10 px-3 py-2 bg-gray-50/50 border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={sortBy}
            onChange={(e) => setBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="active">Recently Active</option>
            <option value="invoices">Most Invoices</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-gray-500 px-1">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">User / Company</th>
                <th className="px-6 py-4">Plan Status</th>
                <th className="px-6 py-4 text-center">Invoices</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((user) => (
                <tr key={user.out_profile_id} className="hover:bg-gray-50/50 even:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-200">
                        {user.out_logo_url ? (
                          <img src={user.out_logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{user.out_full_name || 'No Name'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.out_email}
                        </div>
                        <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3" /> {user.out_company_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Badge 
                        variant="secondary" 
                        className={`w-fit px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                          (user.out_plan_slug === 'pro' || user.out_plan_slug?.toLowerCase() === 'monthly') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          user.out_plan_slug === 'yearly' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          user.out_plan_slug === 'trial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          user.out_plan_slug === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          user.out_plan_slug === 'expired' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-gray-50 text-gray-600 border-gray-100'
                        }`}
                      >
                        {user.out_plan_slug?.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                        <Calendar className="h-3 w-3" />
                        {user.out_period_end ? format(new Date(user.out_period_end), 'MMM dd, yyyy') : 'No Expiry'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-700">{user.out_invoice_count}</span>
                      <span className="text-[10px] text-gray-400 uppercase">Total</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {user.out_last_active ? format(new Date(user.out_last_active), 'MMM dd, HH:mm') : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="View Branding (Impersonate)"
                        onClick={() => { setSelectedUser(user); setIsBrandingOpen(true); }}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        title="Manual Override"
                        onClick={() => { setSelectedUser(user); setIsOverrideOpen(true); }}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </Card>

      {/* Override Dialog */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Administrative Override</DialogTitle>
            <DialogDescription>
              Modify subscription for <strong>{selectedUser?.out_email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="justify-start h-14" 
              onClick={() => handleOverride(selectedUser.out_profile_id, 'extend_trial')}
              disabled={processing}
            >
              <Calendar className="mr-3 h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Extend Trial</div>
                <div className="text-xs text-gray-500">Add 7 days to the current trial period.</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-14"
              onClick={() => handleOverride(selectedUser.out_profile_id, 'activate_pro')}
              disabled={processing}
            >
              <ShieldCheck className="mr-3 h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Activate Pro (1 Month)</div>
                <div className="text-xs text-gray-500">Manually grant full Pro features immediately.</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-14 border-red-100 hover:bg-red-50 hover:border-red-200"
              onClick={() => handleOverride(selectedUser.out_profile_id, 'cancel')}
              disabled={processing}
            >
              <Trash2 className="mr-3 h-5 w-5 text-red-500" />
              <div className="text-left">
                <div className="font-semibold text-red-600">Cancel / Remove Pro</div>
                <div className="text-xs text-red-400">Revert user to Free plan and remove features.</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Impersonation/Branding Dialog */}
      <Dialog open={isBrandingOpen} onOpenChange={setIsBrandingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile & Branding</DialogTitle>
            <DialogDescription>Quick view of how this user's invoices look.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img src={selectedUser.out_logo_url} alt="Logo" className="h-16 w-16 object-contain bg-white p-2 rounded border" />
                  <div>
                    <h3 className="font-bold">{selectedUser.out_company_name}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.out_email}</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded">
                    <div className="text-gray-400 text-[10px] uppercase font-bold">Plan</div>
                    <div>{selectedUser.out_plan_slug.toUpperCase()}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-gray-400 text-[10px] uppercase font-bold">Total Volume</div>
                    <div>{selectedUser.out_invoice_count} Invoices</div>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default User360Tab;
