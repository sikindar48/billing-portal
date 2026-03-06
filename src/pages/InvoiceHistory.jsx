import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Eye, Trash2, Download, Search, FileText, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle, XCircle, Mail, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import Navigation from '@/components/Navigation';
import { generatePDF } from '@/utils/pdfGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FloatingLabelInput from '@/components/FloatingLabelInput';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState({}); // Track statuses locally
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    reference_number: '',
    notes: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
      
      // Initialize statuses from localStorage or default to 'draft'
      const savedStatuses = localStorage.getItem(`invoice_statuses_${user.id}`);
      if (savedStatuses) {
        setInvoiceStatuses(JSON.parse(savedStatuses));
      } else {
        const defaultStatuses = {};
        (data || []).forEach(inv => {
          defaultStatuses[inv.id] = 'draft';
        });
        setInvoiceStatuses(defaultStatuses);
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Invoice deleted successfully');
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (error) {
      toast.error('Failed to delete invoice');
    } finally {
      setProcessingId(null);
    }
  };

  const handleView = (invoice) => {
    const invoiceData = {
        billTo: invoice.bill_to,
        shipTo: invoice.ship_to,
        invoice: invoice.invoice_details,
        yourCompany: invoice.from_details,
        items: invoice.items,
        taxPercentage: invoice.tax,
        taxAmount: (invoice.subtotal * invoice.tax / 100).toFixed(2),
        subTotal: invoice.subtotal,
        grandTotal: invoice.grand_total,
        notes: invoice.notes,
        selectedCurrency: invoice.currency || "INR"
    };
    
    navigate('/dashboard', { state: { invoiceData } });
  };

  const handleDownload = async (invoice) => {
    setProcessingId(invoice.id);
    try {
        const formData = {
            billTo: invoice.bill_to,
            shipTo: invoice.ship_to,
            invoice: invoice.invoice_details,
            yourCompany: invoice.from_details,
            items: invoice.items,
            taxPercentage: invoice.tax,
            notes: invoice.notes,
            selectedCurrency: invoice.currency || "INR"
        };
        
        await generatePDF(formData, 1); 
        toast.success("Invoice downloaded!");
    } catch (error) {
        console.error(error);
        toast.error("Failed to generate PDF");
    } finally {
        setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText, label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Mail, label: 'Sent' },
      paid: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Paid' },
      cancelled: { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        toast.error('Invoice not found');
        return;
      }

      // Update local state and localStorage
      const updatedStatuses = {
        ...invoiceStatuses,
        [invoiceId]: newStatus
      };
      setInvoiceStatuses(updatedStatuses);
      localStorage.setItem(`invoice_statuses_${user.id}`, JSON.stringify(updatedStatuses));

      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const invoiceAmount = invoice.grand_total || 0;
    
    if (invoiceAmount <= 0) {
      toast.error('Invalid invoice amount');
      return;
    }
    
    setPaymentData({
      amount: invoiceAmount.toString(),
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_id: '',
      reference_number: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSavingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: selectedInvoice.id,
          user_id: user.id,
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date,
          transaction_id: paymentData.transaction_id || null,
          reference_number: paymentData.reference_number || null,
          notes: paymentData.notes || null,
          status: 'completed'
        });

      if (paymentError) throw paymentError;

      const invoiceAmount = selectedInvoice.grand_total || 0;
      if (parseFloat(paymentData.amount) >= invoiceAmount) {
        await handleStatusChange(selectedInvoice.id, 'paid');
      }

      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      loadInvoices();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleConvertToTaxInvoice = async (proformaInvoice) => {
    if (!confirm('Convert this Proforma Invoice to a Tax Invoice? This will generate a new invoice number and record the payment.')) {
      return;
    }

    setProcessingId(proformaInvoice.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validation checks
      if (proformaInvoice.invoice_mode !== 'proforma') {
        toast.error('Only proforma invoices can be converted');
        setProcessingId(null);
        return;
      }

      if (proformaInvoice.converted_from_id) {
        toast.error('This invoice has already been converted');
        setProcessingId(null);
        return;
      }

      if (!proformaInvoice.items || proformaInvoice.items.length === 0) {
        toast.error('Cannot convert invoice without items');
        setProcessingId(null);
        return;
      }

      // Import the invoice number generator
      const { generateSecureInvoiceNumber } = await import('@/utils/invoiceNumberGenerator');
      
      // Generate new invoice number with 'INV' prefix for tax invoice
      const newInvoiceNumber = generateSecureInvoiceNumber('INV', 6);

      // Create new tax invoice record
      const taxInvoiceData = {
        user_id: user.id,
        invoice_number: newInvoiceNumber,
        invoice_mode: 'tax_invoice',
        status: 'paid',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: proformaInvoice.due_date,
        
        // Copy customer data
        customer_name: proformaInvoice.customer_name,
        customer_email: proformaInvoice.customer_email,
        customer_address: proformaInvoice.customer_address,
        
        // Copy amounts
        subtotal: proformaInvoice.subtotal,
        tax_amount: proformaInvoice.tax_amount,
        grand_total: proformaInvoice.grand_total,
        
        // Copy other details
        currency: proformaInvoice.currency,
        currency_symbol: proformaInvoice.currency_symbol,
        notes: proformaInvoice.notes,
        terms: proformaInvoice.terms,
        template_id: proformaInvoice.template_id,
        
        // Copy legacy fields
        bill_to: proformaInvoice.bill_to,
        ship_to: proformaInvoice.ship_to,
        invoice_details: proformaInvoice.invoice_details,
        from_details: proformaInvoice.from_details,
        items: proformaInvoice.items,
        tax: proformaInvoice.tax,
        
        // Conversion tracking
        converted_from_id: proformaInvoice.id,
        conversion_date: new Date().toISOString(),
        paid_at: new Date().toISOString()
      };

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(taxInvoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Copy invoice items
      if (proformaInvoice.items && proformaInvoice.items.length > 0) {
        const invoiceItems = proformaInvoice.items.map((item, index) => ({
          invoice_id: newInvoice.id,
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: item.amount,
          amount: item.total,
          sort_order: index
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (itemsError) {
          console.error('Error copying invoice items:', itemsError);
        }
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: newInvoice.id,
          user_id: user.id,
          amount: proformaInvoice.grand_total,
          payment_method: 'conversion',
          payment_date: new Date().toISOString().split('T')[0],
          notes: `Converted from Proforma Invoice ${proformaInvoice.invoice_number}`,
          status: 'completed'
        });

      if (paymentError) {
        console.error('Error recording payment:', paymentError);
      }

      // Log conversion in audit_logs
      try {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          user_identity_type: 'user',
          action_type: 'invoice_converted',
          resource_type: 'invoice',
          resource_id: newInvoice.id,
          details: `Converted Proforma ${proformaInvoice.invoice_number} to Tax Invoice ${newInvoiceNumber}`,
          old_values: { invoice_mode: 'proforma', invoice_id: proformaInvoice.id },
          new_values: { invoice_mode: 'tax_invoice', invoice_id: newInvoice.id }
        });
      } catch (auditError) {
        console.warn('Failed to log audit entry:', auditError);
      }

      toast.success(`Tax Invoice ${newInvoiceNumber} created successfully!`, { duration: 4000 });
      loadInvoices();
    } catch (error) {
      console.error('Error converting to tax invoice:', error);
      toast.error('Failed to convert invoice: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.bill_to?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
             <div>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-500 hover:text-gray-800 pl-0 hover:bg-transparent mb-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoice History</h1>
                <p className="text-gray-500 text-sm mt-1">Manage and track all your generated documents.</p>
             </div>

             {/* Search & Filter */}
             <div className="flex gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:min-w-[250px]">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                     <input 
                        type="text" 
                        placeholder="Search invoices..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                 </div>
                 
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
             </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {filteredInvoices.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <FileText className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
                    <p className="text-gray-500 mt-1 mb-6 max-w-sm">
                        {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : "You haven't created any invoices yet"}
                    </p>
                    <Button onClick={() => navigate('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Create First Invoice
                    </Button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Invoice #</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Client</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Amount</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-semibold text-indigo-600">
                                        {invoice.invoice_number}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{invoice.customer_name || invoice.bill_to?.name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{invoice.customer_email || invoice.bill_to?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Select
                                            value={invoice.status || 'draft'}
                                            onValueChange={(value) => handleStatusChange(invoice.id, value)}
                                        >
                                            <SelectTrigger className="w-[130px] h-8 border-0 focus:ring-0">
                                                <SelectValue>
                                                    {getStatusBadge(invoice.status || 'draft')}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="sent">Sent</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {formatCurrency(invoice.grand_total, invoice.currency || 'INR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            {invoice.invoice_mode === 'proforma' && invoice.status !== 'paid' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleConvertToTaxInvoice(invoice)}
                                                    title="Convert to Tax Invoice"
                                                    disabled={processingId === invoice.id}
                                                    className="text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </Button>
                                            )}
                                            
                                            {invoice.status !== 'paid' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenPaymentModal(invoice)}
                                                    title="Record Payment"
                                                    className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <DollarSign className="h-4 w-4" />
                                                </Button>
                                            )}
                                            
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleView(invoice)}
                                                title="View / Edit"
                                                className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownload(invoice)}
                                                title="Download PDF"
                                                disabled={processingId === invoice.id}
                                                className="text-gray-400 hover:text-green-600 hover:bg-green-50"
                                            >
                                                {processingId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(invoice.id)}
                                                title="Delete"
                                                disabled={processingId === invoice.id}
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Invoice #{selectedInvoice.invoice_number}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(selectedInvoice.grand_total, selectedInvoice.currency || 'INR')}
                </div>
              </div>

              <FloatingLabelInput
                id="amount"
                name="amount"
                label="Payment Amount"
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FloatingLabelInput
                id="payment_date"
                name="payment_date"
                label="Payment Date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                required
              />

              <FloatingLabelInput
                id="transaction_id"
                name="transaction_id"
                label="Transaction ID (Optional)"
                value={paymentData.transaction_id}
                onChange={(e) => setPaymentData(prev => ({ ...prev, transaction_id: e.target.value }))}
              />

              <FloatingLabelInput
                id="reference_number"
                name="reference_number"
                label="Reference Number (Optional)"
                value={paymentData.reference_number}
                onChange={(e) => setPaymentData(prev => ({ ...prev, reference_number: e.target.value }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="Additional payment notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleRecordPayment}
                  disabled={savingPayment}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {savingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={savingPayment}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceHistory;
