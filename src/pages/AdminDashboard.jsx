import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, TrendingUp, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, trialing: 0 });
  
  // State to track which user is currently being deleted
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Call the RPC function we created in SQL
      const { data, error } = await supabase.rpc('get_admin_dashboard_data');

      if (error) throw error;

      setUsers(data || []);

      // Calculate simple stats
      const total = data.length;
      const active = data.filter(u => u.status === 'active').length;
      const trialing = data.filter(u => u.status === 'trialing').length;
      setStats({ total, active, trialing });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}? This will wipe all their data (invoices, settings, etc.) permanently.`)) {
      return;
    }

    setDeletingId(userId);
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });

      if (error) throw error;

      toast.success(`User ${email} deleted successfully.`);
      
      // Remove from local state to update UI instantly
      setUsers(users.filter(u => u.user_id !== userId));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
      
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
      switch(status) {
          case 'active': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Active</Badge>;
          case 'trialing': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Trial</Badge>;
          case 'expired': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Expired</Badge>;
          default: return <Badge variant="outline">{status || 'Unknown'}</Badge>;
      }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <Badge variant="secondary" className="text-sm px-3 py-1">Administrator View</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Active Subscriptions</CardTitle></CardHeader>
                <CardContent className="flex items-center"><div className="text-3xl font-bold text-green-600">{stats.active}</div><TrendingUp className="ml-2 h-4 w-4 text-green-500"/></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">On Free Trial</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-blue-600">{stats.trialing}</div></CardContent>
            </Card>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600"/> User Management</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Company Name</th>
                            <th className="px-6 py-3">Current Plan</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Expires / Renews</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.user_id} className="bg-white hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                                <td className="px-6 py-4 text-gray-600">{user.company_name || '-'}</td>
                                <td className="px-6 py-4 font-semibold text-indigo-600">{user.plan_name || 'None'}</td>
                                <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {user.period_end ? format(new Date(user.period_end), 'MMM dd, yyyy') : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteUser(user.user_id, user.email)}
                                        disabled={deletingId === user.user_id}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        title="Delete User"
                                    >
                                        {deletingId === user.user_id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                                        No users found.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;