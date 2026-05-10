import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Search, User, ExternalLink, Calendar, ShieldCheck, Mail, Building, FileText, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const User360Tab = ({ users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search users or companies..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">User / Company</th>
                <th className="px-6 py-4">Plan Status</th>
                <th className="px-6 py-4">Invoices</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-200">
                        {user.logo_url ? (
                          <img src={user.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email}
                        </div>
                        <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3" /> {user.company_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge className={
                        user.plan_slug === 'trial' ? 'bg-blue-100 text-blue-700' : 
                        user.plan_slug === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                        'bg-indigo-100 text-indigo-700'
                      }>
                        {user.plan_slug.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        Expires: {user.period_end ? format(new Date(user.period_end), 'MMM dd, yyyy') : 'Never'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700">{user.invoice_count}</span>
                      <span className="text-[10px] text-gray-400 uppercase">Total Invoices</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {user.last_active ? format(new Date(user.last_active), 'MMM dd, HH:mm') : 'Never'}
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
      </Card>

      {/* Override Dialog */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Administrative Override</DialogTitle>
            <DialogDescription>
              Modify subscription for <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="justify-start h-14" 
              onClick={() => handleOverride(selectedUser.user_id, 'extend_trial')}
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
              onClick={() => handleOverride(selectedUser.user_id, 'activate_pro')}
              disabled={processing}
            >
              <ShieldCheck className="mr-3 h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Activate Pro (1 Month)</div>
                <div className="text-xs text-gray-500">Manually grant full Pro features immediately.</div>
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
                  <img src={selectedUser.logo_url} alt="Logo" className="h-16 w-16 object-contain bg-white p-2 rounded border" />
                  <div>
                    <h3 className="font-bold">{selectedUser.company_name}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded">
                    <div className="text-gray-400 text-[10px] uppercase font-bold">Plan</div>
                    <div>{selectedUser.plan_slug.toUpperCase()}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-gray-400 text-[10px] uppercase font-bold">Total Volume</div>
                    <div>{selectedUser.invoice_count} Invoices</div>
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
