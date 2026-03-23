import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navigation from '@/components/Navigation';
import { Loader2, Plus, Edit, Trash2, User, Mail, Phone, MapPin, Search } from 'lucide-react';
import FloatingLabelInput from '@/components/FloatingLabelInput';

const Customers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    tax_id: '',
    notes: ''
  });

  useEffect(() => {
    if (user) loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        country: customer.country || '',
        tax_id: customer.tax_id || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        tax_id: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setSaving(true);
    try {
      if (!user) throw new Error('Not authenticated');

      if (editingCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
        toast.success('Customer updated successfully');
      } else {
        // Create new customer
        const { error } = await supabase
          .from('customers')
          .insert({ ...formData, user_id: user.id });

        if (error) throw error;
        toast.success('Customer created successfully');
      }

      setIsModalOpen(false);
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Customer deleted successfully');
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your customer database</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            {/* Add Button */}
            <Button
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try a different search term' : 'Get started by adding your first customer'}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{customer.name}</h3>
                    {customer.email && (
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Mail className="h-3.5 w-3.5 mr-2" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 mr-2" />
                        {customer.phone}
                      </div>
                    )}
                  </div>
                </div>

                {customer.address && (
                  <div className="flex items-start text-sm text-gray-600 mb-4">
                    <MapPin className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.state && `, ${customer.state}`}
                      {customer.zip_code && ` ${customer.zip_code}`}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(customer)}
                    className="flex-1"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingLabelInput
                id="name"
                name="name"
                label="Customer Name *"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <FloatingLabelInput
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingLabelInput
                id="phone"
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
              <FloatingLabelInput
                id="tax_id"
                name="tax_id"
                label="Tax ID"
                value={formData.tax_id}
                onChange={handleInputChange}
              />
            </div>

            <FloatingLabelInput
              id="address"
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleInputChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FloatingLabelInput
                id="city"
                name="city"
                label="City"
                value={formData.city}
                onChange={handleInputChange}
              />
              <FloatingLabelInput
                id="state"
                name="state"
                label="State"
                value={formData.state}
                onChange={handleInputChange}
              />
              <FloatingLabelInput
                id="zip_code"
                name="zip_code"
                label="ZIP Code"
                value={formData.zip_code}
                onChange={handleInputChange}
              />
            </div>

            <FloatingLabelInput
              id="country"
              name="country"
              label="Country"
              value={formData.country}
              onChange={handleInputChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                placeholder="Additional notes about this customer..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCustomer ? 'Update Customer' : 'Create Customer'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
