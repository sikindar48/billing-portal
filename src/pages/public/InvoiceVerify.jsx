import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Search, CheckCircle2, XCircle, FileText, Building2, User, DollarSign, Calendar, AlertCircle, BadgeCheck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatCurrency';
import { format } from 'date-fns';
import FloatingLabelInput from '@/components/FloatingLabelInput';

const InvoiceVerify = () => {
  const location = useLocation();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const number = params.get('number');
    const searchParam = id || number;

    if (searchParam) {
      setInvoiceNumber(searchParam);
      handleVerify(searchParam);
    }
  }, [location]);

  const handleVerify = async (manualTerm = null) => {
    const searchTerm = (manualTerm || invoiceNumber).trim();
    if (!searchTerm) {
      toast.error('Please enter an invoice number or ID');
      return;
    }

    setLoading(true);
    setInvoice(null);
    setNotFound(false);

    try {
      // Safely query based on whether the search term is a UUID or an invoice number
      let query = supabase.from('invoices').select('*');
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
      
      if (isUUID) {
        query = query.or(`id.eq.${searchTerm},invoice_number.eq.${searchTerm}`);
      } else {
        query = query.eq('invoice_number', searchTerm);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
        toast.error('Invoice not found');
      } else {
        setInvoice(data);
        toast.success('Invoice verified successfully');
      }
    } catch (error) {
      console.error('Error verifying invoice:', error);
      toast.error('Failed to verify invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    const shareLink = window.location.href;
    const message = `Hi, I've verified this invoice #${invoice.invoice_number} from ${invoice.from_details?.name || 'our system'}. You can view the verification status here: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText, label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileText, label: 'Sent' },
      paid: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Paid' },
      overdue: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle, label: 'Cancelled' }
    };

    const style = config[status] || config.draft;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${style.color}`}>
        <Icon className="h-4 w-4" />
        {style.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Verification</h1>
              <p className="text-sm text-gray-500">Verify the authenticity of your invoice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Search Card */}
        <Card className="shadow-lg border-gray-200 mb-8">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Search className="h-5 w-5" />
              Enter Invoice Number
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <FloatingLabelInput
                  id="invoice_number"
                  name="invoice_number"
                  label="Invoice Number or ID"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="e.g., INV-26-K8D4L2 or UUID"
                />
              </div>
              <Button 
                onClick={handleVerify} 
                disabled={loading || !invoiceNumber.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Enter the invoice number (e.g., INV-26-K8D4L2) or invoice ID exactly as it appears on your invoice document
            </p>
          </CardContent>
        </Card>

        {/* Not Found Message */}
        {notFound && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Invoice Not Found</h3>
                  <p className="text-sm text-red-700">
                    No invoice found with number "{invoiceNumber}". Please check the invoice number and try again.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Details */}
        {invoice && (
          <div className="space-y-6">
            {/* Verification Success Banner */}
            <Card className="border-green-200 bg-green-50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1 text-lg">Invoice Verified</h3>
                      <p className="text-sm text-green-700">
                        This document is authentic and recorded in our secure billing portal.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleShareWhatsApp}
                    className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 h-11 px-6 font-semibold"
                  >
                    <MessageCircle className="h-5 w-5" /> Share Verification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Information */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">Invoice Details</CardTitle>
                    <p className="text-sm text-gray-500">Invoice #{invoice.invoice_number}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(invoice.status)}
                    {invoice.invoice_mode && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        invoice.invoice_mode === 'tax_invoice' 
                          ? 'bg-purple-100 text-purple-700 border-purple-200' 
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {invoice.invoice_mode === 'tax_invoice' ? 'Tax Invoice' : 'Proforma Invoice'}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Company Name</div>
                        <div className="font-semibold text-gray-900">
                          {invoice.from_details?.name || 'N/A'}
                        </div>
                        {invoice.from_details?.address && (
                          <div className="text-sm text-gray-600 mt-1">{invoice.from_details.address}</div>
                        )}
                        {invoice.from_details?.phone && (
                          <div className="text-sm text-gray-600">{invoice.from_details.phone}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Customer Name</div>
                        <div className="font-semibold text-gray-900">
                          {invoice.customer_name || invoice.bill_to?.name || 'N/A'}
                        </div>
                        {invoice.customer_email && (
                          <div className="text-sm text-gray-600 mt-1">{invoice.customer_email}</div>
                        )}
                        {invoice.customer_address && (
                          <div className="text-sm text-gray-600">{invoice.customer_address}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Amount</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(invoice.grand_total, invoice.currency || 'INR')}
                        </div>
                        {invoice.subtotal && (
                          <div className="text-sm text-gray-600 mt-1">
                            Subtotal: {formatCurrency(invoice.subtotal, invoice.currency || 'INR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Due Date</div>
                        <div className="font-semibold text-gray-900">
                          {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                        {invoice.issue_date && (
                          <div className="text-sm text-gray-600 mt-1">
                            Issued: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">Notes</div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {invoice.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proforma Invoice Disclaimer */}
            {invoice.invoice_mode === 'proforma' && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Proforma Invoice Notice</p>
                      <p>
                        This is a Proforma Invoice and not a final tax receipt. It represents a preliminary bill 
                        issued before payment. A Tax Invoice will be issued upon payment confirmation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tax Invoice Info */}
            {invoice.invoice_mode === 'tax_invoice' && invoice.converted_from_id && (
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-800">
                      <p className="font-semibold mb-1">Tax Invoice</p>
                      <p>
                        This is an official Tax Invoice issued after payment confirmation. 
                        {invoice.conversion_date && ` Converted on ${format(new Date(invoice.conversion_date), 'MMM dd, yyyy')}.`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Notice */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Security Notice</p>
                    <p>
                      This verification confirms the invoice exists in our system. For payment disputes or questions, 
                      please contact the company directly using the information shown above.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Card (shown when no search performed) */}
        {!invoice && !notFound && !loading && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-2">How to Verify an Invoice</h3>
                  <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
                    <li>Enter the invoice number from your invoice document</li>
                    <li>Click "Verify" to check authenticity</li>
                    <li>View company and invoice details if verified</li>
                    <li>Contact the company directly for any questions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoiceVerify;
