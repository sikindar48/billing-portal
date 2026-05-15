import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Eye, Trash2, Download, Search, FileText, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle, XCircle, Mail, ArrowRightLeft, MessageCircle, FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FloatingLabelInput from '@/components/FloatingLabelInput';

// Debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Loading skeleton for the invoice table
const InvoiceTableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
          <tr>
            {['Invoice #', 'Date', 'Client', 'Status', 'Amount', 'Actions'].map(h => (
              <th key={h} className="px-6 py-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map(i => (
            <tr key={i} className="animate-pulse">
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
              <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full" /></td>
              <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded ml-auto" /></td>
              <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-200 rounded ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search by 300ms
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 15;
  
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  // Convert confirmation state
  const [convertConfirmInvoice, setConvertConfirmInvoice] = useState(null);
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
    if (user?.id) loadInvoices(1);
  }, [user?.id, statusFilter, modeFilter, debouncedSearchTerm]);

  const loadInvoices = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('invoices')
        .select('id, invoice_number, created_at, grand_total, bill_to, invoice_details, template_name', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply Filters in Query (Server-side filtering is much faster)
      if (statusFilter !== 'all') {
        // Querying JSONB status
        query = query.filter('invoice_details->>status', 'eq', statusFilter);
      }
      
      if (modeFilter !== 'all') {
        query = query.filter('invoice_details->>invoiceMode', 'eq', modeFilter);
      }

      if (debouncedSearchTerm) {
        query = query.or(`invoice_number.ilike.%${debouncedSearchTerm}%,customer_name.ilike.%${debouncedSearchTerm}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setInvoices(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading invoices:', err);
      const errorMsg = err.message || 'Failed to load invoices';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullInvoice = async (id) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      toast.error('Failed to fetch full invoice details');
      return null;
    }
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }

    try {
      const headers = [
        "Invoice Number", "Date", "Status", "Mode", "Client Name", "Client GSTIN", 
        "Subtotal", "Tax %", "Tax Amount", "Grand Total", "Currency"
      ];

      const csvRows = [headers.join(",")];

      filteredInvoices.forEach(inv => {
        const row = [
          `"${inv.invoice_number}"`,
          `"${inv.invoice_details?.date || ''}"`,
          `"${inv.status}"`,
          `"${inv.invoice_details?.invoiceMode || 'proforma'}"`,
          `"${inv.bill_to?.name || ''}"`,
          `"${inv.bill_to?.taxId || ''}"`,
          inv.subtotal,
          inv.tax || 0,
          ((inv.subtotal * (inv.tax || 0)) / 100).toFixed(2),
          inv.grand_total,
          `"${inv.invoice_details?.selectedCurrency || 'INR'}"`
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Invoices_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Invoices exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export invoices");
    }
  };

  const handleDelete = async (id) => {
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
      setDeleteConfirmId(null);
    }
  };

  const handleView = async (invoice) => {
    setProcessingId(invoice.id);
    const fullInvoice = await fetchFullInvoice(invoice.id);
    setProcessingId(null);
    
    if (!fullInvoice) return;

    // Pass the original invoice number — do NOT generate a new number.
    // viewMode flag tells Dashboard to skip draft-number generation.
    const invoiceData = {
        billTo: fullInvoice.bill_to,
        shipTo: fullInvoice.ship_to,
        invoice: {
            ...(fullInvoice.invoice_details || {}),
            number: fullInvoice.invoice_number, // preserve original number
            date: fullInvoice.issue_date || fullInvoice.invoice_details?.date,
            paymentDate: fullInvoice.due_date || fullInvoice.invoice_details?.paymentDate,
        },
        yourCompany: fullInvoice.from_details,
        items: fullInvoice.items,
        taxPercentage: fullInvoice.tax,
        taxAmount: (fullInvoice.subtotal * fullInvoice.tax / 100).toFixed(2),
        subTotal: fullInvoice.subtotal,
        grandTotal: fullInvoice.grand_total,
        notes: fullInvoice.notes,
        selectedCurrency: fullInvoice.currency || "INR",
        invoiceMode: fullInvoice.invoice_details?.invoiceMode || 'proforma',
        _sourceInvoiceId: fullInvoice.id,
    };
    
    navigate('/dashboard', { state: { invoiceData, viewMode: true } });
  };

  const handleDownload = async (invoice) => {
    setProcessingId(invoice.id);
    try {
        const fullInvoice = await fetchFullInvoice(invoice.id);
        if (!fullInvoice) return;

        const taxPct = fullInvoice.tax || 0;
        const sub = fullInvoice.subtotal || 0;
        const taxAmt = (sub * taxPct) / 100;
        const currency = fullInvoice.invoice_details?.currency || 'INR';

        const formData = {
            billTo: fullInvoice.bill_to,
            shipTo: fullInvoice.ship_to,
            invoice: {
                ...(fullInvoice.invoice_details || {}),
                number: fullInvoice.invoice_number,
            },
            yourCompany: fullInvoice.from_details,
            items: fullInvoice.items || [],
            taxPercentage: taxPct,
            taxAmount: taxAmt,
            subTotal: sub,
            grandTotal: fullInvoice.grand_total || 0,
            notes: fullInvoice.notes,
            selectedCurrency: currency,
        };

        // Read template number from template_name (e.g. "template_3" → 3), default 3
        const templateNumber = fullInvoice.template_name
            ? parseInt(fullInvoice.template_name.replace('template_', ''), 10) || 3
            : 3;

        const { generatePDF } = await import('@/utils/pdfGenerator');
        await generatePDF(formData, templateNumber);
        toast.success("Invoice downloaded!");
    } catch (error) {
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
      <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border leading-none ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const handleStatusChange = async (invoiceId, newStatus, existingUserId = null) => {
    // Optimistic update — update UI immediately
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId
        ? { ...inv, invoice_details: { ...(inv.invoice_details || {}), status: newStatus } }
        : inv
    ));
    try {
      const uid = existingUserId || user?.id;
      if (!uid) { toast.error('Not authenticated'); return; }

      // Fetch current invoice_details then merge status
      const { data: current, error: fetchErr } = await supabase
        .from('invoices')
        .select('invoice_details')
        .eq('id', invoiceId)
        .eq('user_id', uid)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const { error } = await supabase
        .from('invoices')
        .update({ invoice_details: { ...(current.invoice_details || {}), status: newStatus } })
        .eq('id', invoiceId)
        .eq('user_id', uid);

      if (error) throw error;
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message || 'Unknown error'}`);
      // Revert optimistic update on failure
      loadInvoices();
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
      // 1. Persist the payment details in the dedicated table
      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: selectedInvoice.id,
          user_id: user.id,
          amount: parseFloat(paymentData.amount),
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          transaction_id: paymentData.transaction_id || null,
          reference_number: paymentData.reference_number || null,
          notes: paymentData.notes || null
        });

      if (paymentError) throw paymentError;

      // 2. Mark invoice as paid if full amount received
      const invoiceAmount = selectedInvoice.grand_total || 0;
      if (parseFloat(paymentData.amount) >= invoiceAmount) {
        await handleStatusChange(selectedInvoice.id, 'paid', user.id);
      }

      toast.success('Payment recorded and persisted successfully');
      setIsPaymentModalOpen(false);
      loadInvoices();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingPayment(false);
    }
  };

  const handleConvertToTaxInvoice = async (proformaInvoice) => {
    setConvertConfirmInvoice(null);
    setProcessingId(proformaInvoice.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validation checks
      if ((proformaInvoice.invoice_details?.invoiceMode || 'proforma') !== 'proforma') {
        toast.error('Only proforma invoices can be converted');
        setProcessingId(null);
        return;
      }

      if (proformaInvoice.converted_from_id) {
        toast.error('This invoice has already been converted');
        setProcessingId(null);
        return;
      }

      // Also block if the proforma itself was already marked converted
      if ((proformaInvoice.invoice_details?.status || proformaInvoice.status) === 'converted') {
        toast.error('This proforma has already been converted to a tax invoice');
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

      // Create new tax invoice record — only columns that exist in DB schema
      const taxInvoiceData = {
        user_id: user.id,
        invoice_number: newInvoiceNumber,
        
        // Copy amounts
        subtotal: proformaInvoice.subtotal,
        grand_total: proformaInvoice.grand_total,
        
        // Copy other details
        notes: proformaInvoice.notes,
        template_name: proformaInvoice.template_name,
        
        // Copy JSONB fields (bill_to contains customer data)
        bill_to: proformaInvoice.bill_to,
        ship_to: proformaInvoice.ship_to,
        invoice_details: {
          ...(proformaInvoice.invoice_details || {}),
          invoiceMode: 'tax_invoice',
          status: 'paid',
          converted_from_id: proformaInvoice.id,
          conversion_date: new Date().toLocaleDateString('en-GB'),
        },
        from_details: proformaInvoice.from_details,
        items: proformaInvoice.items,
        tax: proformaInvoice.tax,
      };

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(taxInvoiceData)
        .select()
        .maybeSingle();

      if (invoiceError) throw invoiceError;

      // Mark the source proforma as 'converted' to prevent duplicate conversions
      const { data: srcInvoice } = await supabase
        .from('invoices')
        .select('invoice_details')
        .eq('id', proformaInvoice.id)
        .maybeSingle();

      await supabase
        .from('invoices')
        .update({ invoice_details: { ...(srcInvoice?.invoice_details || {}), status: 'converted' } })
        .eq('id', proformaInvoice.id)
        .eq('user_id', user.id);

      toast.success(`Tax Invoice ${newInvoiceNumber} created successfully!`, { duration: 4000 });
      loadInvoices();
    } catch (error) {
      console.error('Error converting to tax invoice:', error);
      toast.error('Failed to convert invoice: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices; // Filtering is now done server-side for performance
  }, [invoices]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <InvoiceTableSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Invoices</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={() => { setLoading(true); setError(null); loadInvoices(); }} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-indigo-600 h-6 w-6" /> Invoice History
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track all your generated documents.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Export GSTR-1</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg border border-indigo-100 text-sm font-medium shadow-sm">
                Total: {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'}
              </div>
            </div>
        </div>

             {/* Search & Filter */}
             <div className="flex flex-col md:flex-row gap-4 mb-8 w-full">
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
                        <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                </Select>

                 <Select value={modeFilter} onValueChange={setModeFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="proforma">Proforma</SelectItem>
                        <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                    </SelectContent>
                </Select>
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
                                            {invoice.invoice_details?.date || new Date(invoice.created_at).toLocaleDateString('en-GB')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{invoice.customer_name || invoice.bill_to?.name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{invoice.customer_email || invoice.bill_to?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Select
                                            value={invoice.invoice_details?.status || 'draft'}
                                            onValueChange={(value) => handleStatusChange(invoice.id, value)}
                                        >
                                            <SelectTrigger className="w-[130px] h-9 border-gray-100 bg-transparent hover:bg-gray-50/50 transition-colors focus:ring-0 px-2 rounded-lg">
                                                <SelectValue>
                                                    {getStatusBadge(invoice.invoice_details?.status || 'draft')}
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
                                        {formatCurrency(invoice.grand_total, invoice.invoice_details?.currency || 'INR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            {(invoice.invoice_details?.invoiceMode || 'proforma') === 'proforma' && (invoice.invoice_details?.status || 'draft') !== 'paid' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setConvertConfirmInvoice(invoice)}
                                                    title="Convert to Tax Invoice"
                                                    disabled={processingId === invoice.id}
                                                    className="text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </Button>
                                            )}
                                            
                                            {(invoice.invoice_details?.status || 'draft') !== 'paid' && (
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
                                                onClick={() => {
                                                  const shareLink = `${window.location.origin}/verify-invoice?number=${invoice.invoice_number}`;
                                                  const message = `Hi, here is your invoice #${invoice.invoice_number} for ${formatCurrency(invoice.grand_total, invoice.invoice_details?.currency || 'INR')}. You can verify and view it here: ${shareLink}`;
                                                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                                }}
                                                title="Share via WhatsApp"
                                                className="text-gray-400 hover:text-green-500 hover:bg-green-50"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteConfirmId(invoice.id)}
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

            {/* Pagination Controls */}
            {totalCount > PAGE_SIZE && (
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={currentPage === 1 || loading}
                            onClick={() => loadInvoices(currentPage - 1)}
                            className="h-8 px-3 text-xs"
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={currentPage * PAGE_SIZE >= totalCount || loading}
                            onClick={() => loadInvoices(currentPage + 1)}
                            className="h-8 px-3 text-xs"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleDelete(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Tax Invoice Confirmation Dialog */}
      <AlertDialog open={!!convertConfirmInvoice} onOpenChange={(open) => !open && setConvertConfirmInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Tax Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Convert this Proforma Invoice to a Tax Invoice? This will generate a new invoice number and record the payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => handleConvertToTaxInvoice(convertConfirmInvoice)}
            >
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
