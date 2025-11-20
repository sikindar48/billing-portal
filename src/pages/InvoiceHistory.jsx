import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Eye, Trash2, Mail, Download, Search, FileText, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import Navigation from '@/components/Navigation';
import { generatePDF } from '@/utils/pdfGenerator';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null); // Track which ID is being downloaded/deleted

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
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (error) {
      toast.error('Failed to delete invoice');
    } finally {
      setProcessingId(null);
    }
  };

  const handleView = (invoice) => {
    // Construct the formData object structure expected by Index.jsx
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
        selectedCurrency: "INR" // Default or store in DB if you support multiple
    };
    
    // Navigate to Index with state
    navigate('/', { state: { invoiceData } });
  };

  const handleDownload = async (invoice) => {
    setProcessingId(invoice.id);
    try {
        // Reconstruct data for PDF generator
        const formData = {
            billTo: invoice.bill_to,
            shipTo: invoice.ship_to,
            invoice: invoice.invoice_details,
            yourCompany: invoice.from_details,
            items: invoice.items,
            taxPercentage: invoice.tax,
            notes: invoice.notes,
            selectedCurrency: "INR"
        };
        
        // Generate using template 1 by default (or store template_name/id in DB)
        await generatePDF(formData, 1); 
        toast.success("Invoice downloaded!");
    } catch (error) {
        console.error(error);
        toast.error("Failed to generate PDF");
    } finally {
        setProcessingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.bill_to?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
             <div>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="text-gray-500 hover:text-gray-800 pl-0 hover:bg-transparent mb-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoice History</h1>
                <p className="text-gray-500 text-sm mt-1">Manage and track all your generated documents.</p>
             </div>

             {/* Search Bar */}
             <div className="relative w-full md:w-auto min-w-[300px]">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="h-4 w-4" /></div>
                 <input 
                    type="text" 
                    placeholder="Search by client or invoice #..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
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
                    <p className="text-gray-500 mt-1 mb-6 max-w-sm">You haven't created any invoices yet, or no invoices match your search.</p>
                    <Button onClick={() => navigate('/')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Create First Invoice
                    </Button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Invoice #</th>
                                <th className="px-6 py-4 font-medium">Date Issued</th>
                                <th className="px-6 py-4 font-medium">Client</th>
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
                                    <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        {new Date(invoice.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{invoice.bill_to?.name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{invoice.bill_to?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {formatCurrency(invoice.grand_total, 'INR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
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
    </div>
  );
};

export default InvoiceHistory;