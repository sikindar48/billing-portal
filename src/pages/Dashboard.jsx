import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Welcome email disabled - using only invoice, order_confirmation, and payment_verification templates
// import { sendWelcomeEmail } from '@/utils/emailService';
import { sendInvoiceEmail, validateInvoiceForEmail } from '@/utils/invoiceEmailService';
import { checkEmailUsageLimit } from '@/utils/emailUsageService';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency'; 
import { generateSecureInvoiceNumber } from '../utils/invoiceNumberGenerator';
import FloatingLabelInput from '../components/FloatingLabelInput';
import BillToSection from '../components/BillToSection';
import ShipToSection from '../components/ShipToSection';
import ItemDetails from "../components/ItemDetails";
import { templates } from "../utils/templateRegistry";
import TemplatePreview from '../components/TemplatePreview';
import SEO from '../components/SEO';
import { FiEdit, FiTrash2, FiLayers } from "react-icons/fi"; 
import { RefreshCw, Save, Loader2, DollarSign, User, FileText, ShoppingBag, StickyNote, Clock, AlertCircle, ShieldCheck, ToggleRight, ToggleLeft, Mail } from "lucide-react"; 
import Navigation from '../components/Navigation';
import { Button } from '@/components/ui/button'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 

const noteOptions = [
  "Thank you for choosing us today! We hope your shopping experience was pleasant.",
  "Payment is due within 30 days. Please include the invoice number on your check.",
  "We appreciate your business and look forward to serving you again.",
  "Please make checks payable to the company name listed above.",
  "Thank you for your prompt payment."
];

// Convert any date string (yyyy-mm-dd or dd/mm/yyyy) to dd/mm/yyyy display format
const toDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr; // already dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

// Initial default state for a clean slate
const getInitialCompany = () => ({ name: "", address: "", phone: "", website: "" });
const getInitialBillTo = () => ({ name: "", address: "", phone: "", email: "" });
const getInitialInvoice = () => ({
    date: (() => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })(),
    paymentDate: "",
    number: generateSecureInvoiceNumber('INV', 6), // Secure non-sequential number
});
const getInitialItems = () => ([{ name: "", description: "", quantity: 0, amount: 0, total: 0 }]);


const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth(); // Read from context — no extra network calls
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailUsageStats, setEmailUsageStats] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(3);
  // brandingApplied ref prevents the branding effect from re-running on every keystroke
  const brandingAppliedRef = useRef(false);
  
  // Usage State
  const [usageStats, setUsageStats] = useState({
      count: 0,
      limit: 10,
      trialEnds: null,
      planName: 'Loading...',
      daysLeft: 0
  });  const [brandingSettings, setBrandingSettings] = useState({
    logoUrl: '',
    brandingCompanyName: '',
    brandingTagline: '',
    brandingWebsite: '',
    address: '',
    phone: '',
    currency: 'INR',
  });

  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [invoiceMode, setInvoiceMode] = useState("proforma"); // 'proforma' or 'tax_invoice'
  const [billTo, setBillTo] = useState({ name: "", address: "", phone: "", email: "" });
  const [shipTo, setShipTo] = useState({ name: "", address: "", phone: "" });
  const [invoice, setInvoice] = useState(getInitialInvoice());
  const [yourCompany, setYourCompany] = useState(getInitialCompany());
  const [items, setItems] = useState(getInitialItems());
  
  // --- STATE FOR TAX & ROUNDING ---
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [taxType, setTaxType] = useState("IGST"); // 'IGST', 'CGST_SGST', or 'PLAIN'
  const [enableRoundOff, setEnableRoundOff] = useState(false);
  
  // Calculated states
  const [taxAmount, setTaxAmount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [roundOffAmount, setRoundOffAmount] = useState(0);

  const [notes, setNotes] = useState("");

  const refreshNotes = () => {
    const randomIndex = Math.floor(Math.random() * noteOptions.length);
    setNotes(noteOptions[randomIndex]);
  };

  // 1. INITIAL DATA FETCH — user & isAdmin come from AuthContext (no extra network calls)
  useEffect(() => {
    if (!user) return;
    const initData = async () => {
        try {
            // Fetch branding (uses the real 'branding_settings' table)
            const { data: branding } = await supabase
                .from('branding_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            if (branding) {
                setBrandingSettings({
                    logoUrl: branding.logo_url || '',
                    brandingCompanyName: branding.company_name || '',
                    brandingTagline: branding.metadata?.tagline || '',
                    brandingWebsite: branding.website || '',
                    address: branding.metadata?.address || '',
                    phone: branding.metadata?.phone || '',
                    currency: branding.metadata?.currency || 'INR',
                });
                if (branding.metadata?.currency) {
                    setSelectedCurrency(branding.metadata.currency);
                }
            }

            // Fetch subscription
            const { data: sub } = await supabase
                .from('user_subscriptions')
                .select('*, subscription_plans(*)')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!sub && user.email_confirmed_at) {
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 3);
                const { error: subError } = await supabase.from('user_subscriptions').upsert({
                    user_id: user.id,
                    plan_id: 1,
                    status: 'trialing',
                    current_period_end: trialEndDate.toISOString()
                }, { onConflict: 'user_id' });
                if (!subError) toast.success('Welcome to InvoicePort! 🎉', { duration: 3000 });
                setUsageStats({ count: 0, limit: 10, planName: 'Free Trial', daysLeft: 3 });
            } else if (sub) {
                const end = new Date(sub.current_period_end);
                const daysLeft = Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
                setUsageStats({
                    count: sub.invoice_usage_count || 0,
                    limit: sub.subscription_plans?.slug === 'trial' ? 10 : 10000,
                    planName: sub.subscription_plans?.name || 'Free Trial',
                    daysLeft,
                });
            }

            // Load from navigation state (view from history)
            if (location.state?.invoiceData) {
                const data = location.state.invoiceData;
                const isViewMode = location.state.viewMode === true;
                setBillTo(data.billTo || getInitialBillTo());
                setShipTo(data.shipTo || getInitialCompany());
                setInvoice(data.invoice
                    ? {
                        ...data.invoice,
                        number: isViewMode ? data.invoice.number : generateSecureInvoiceNumber('INV', 6),
                        date: toDisplayDate(data.invoice.date),
                        paymentDate: toDisplayDate(data.invoice.paymentDate),
                      }
                    : getInitialInvoice());
                setYourCompany(data.yourCompany || getInitialCompany());
                setItems(data.items || getInitialItems());
                setTaxPercentage(data.taxPercentage || 0);
                setTaxType(data.taxType || 'IGST');
                setEnableRoundOff(data.enableRoundOff ?? false);
                setNotes(data.notes || '');
                setSelectedCurrency(data.selectedCurrency || 'INR');
                setInvoiceMode(data.invoiceMode || 'proforma');
            }

        } catch (error) {
            console.error("Error initializing data:", error);
        }
    };
    initData();
  }, [user]);

  // 3. APPLY BRANDING — runs once when branding loads, not on every keystroke
  useEffect(() => {
    if (brandingAppliedRef.current) return; // Only apply once
    if (!brandingSettings.brandingCompanyName && !brandingSettings.address) return; // Branding not loaded yet
    brandingAppliedRef.current = true;
    setYourCompany(prev => ({
        ...prev,
        name: prev.name || brandingSettings.brandingCompanyName || "",
        website: prev.website || brandingSettings.brandingWebsite || "",
        address: prev.address || brandingSettings.address || "",
        phone: prev.phone || brandingSettings.phone || "",
    }));
  }, [brandingSettings]);


  // --- HANDLERS ---
  const handleInputChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    setItems([...items, { name: "", description: "", quantity: 0, amount: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "quantity" || field === "amount") {
      newItems[index].total = newItems[index].quantity * newItems[index].amount;
    }
    setItems(newItems);
  };

  // --- UPDATED CALCULATION LOGIC ---
  useEffect(() => {
    const sub = items.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
    const tax = (sub * taxPercentage) / 100;
    let total = sub + tax;
    
    let roundDiff = 0;
    if (enableRoundOff) {
        const rounded = Math.round(total);
        roundDiff = rounded - total;
        total = rounded;
    }

    setSubTotal(sub);
    setTaxAmount(tax);
    setRoundOffAmount(roundDiff);
    setGrandTotal(total);
  }, [items, taxPercentage, enableRoundOff]);

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    
    // Validation
    if (!billTo.name || !billTo.name.trim()) {
      toast.error('Customer name is required');
      setIsSaving(false);
      return;
    }

    if (!billTo.email || !billTo.email.trim()) {
      toast.error('Customer email is required');
      setIsSaving(false);
      return;
    }

    if (items.length === 0) {
      toast.error('At least one item is required');
      setIsSaving(false);
      return;
    }

    if (items.some(item => !item.name || !item.name.trim() || item.quantity <= 0 || item.amount <= 0)) {
      toast.error('All items must have a name, quantity, and amount');
      setIsSaving(false);
      return;
    }

    if (grandTotal <= 0) {
      toast.error('Invoice total must be greater than zero');
      setIsSaving(false);
      return;
    }
    
    if (!isAdmin && usageStats.count >= usageStats.limit) {
        toast.error(<div className="flex flex-col gap-1"><span className="font-bold">Limit Reached (10/10)</span><span className="text-xs">Upgrade to create more.</span></div>, { duration: 3000 });
        setIsSaving(false);
        return;
    }

    try {
      if (!user) {
        toast.error('Please sign in to save invoices.', { duration: 2000 });
        setIsSaving(false);
        return;
      }

      // Prepare invoice data — only columns that exist in the DB schema
      const invoiceData = {
        user_id: user.id,
        invoice_number: invoice.number,
        
        // Amounts
        subtotal: subTotal,
        grand_total: grandTotal,
        
        // Notes
        notes: notes,
        
        // Template
        template_name: `template_${selectedTemplateId}`,        
        // Store ALL structured data in JSONB fields
        bill_to: billTo,
        ship_to: shipTo,
        invoice_details: { 
            ...invoice,
            invoiceMode,
            status: 'draft',
            taxType, 
            enableRoundOff, 
            roundOffAmount,
            taxAmount,
            currency: selectedCurrency,
            currency_symbol: selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : '₹',
        },
        from_details: { 
            name: yourCompany.name, 
            address: yourCompany.address, 
            phone: yourCompany.phone, 
            website: yourCompany.website,
            tagline: brandingSettings.brandingTagline,
            logo_url: brandingSettings.logoUrl 
        },
        items: items,
        tax: taxPercentage
      };
      const { data: savedInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      await supabase.rpc('increment_invoice_usage');
      setUsageStats(prev => ({ ...prev, count: prev.count + 1 }));
      toast.success('Invoice saved successfully!', { duration: 2000 });
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error('Failed to save invoice: ' + (error.message || 'Unknown error'), { duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    
    try {
      // Validate invoice data
      const invoiceData = {
        billTo,
        invoice,
        yourCompany,
        items,
        grandTotal,
        selectedCurrency,
        taxAmount,
        subTotal,
        notes
      };

      const validation = validateInvoiceForEmail(invoiceData);
      if (!validation.isValid) {
        toast.error(validation.errors[0], { duration: 3000 });
        return;
      }

      // Send email with plan restrictions
      const result = await sendInvoiceEmail(invoiceData, user?.id);
      
      if (result.success) {
        toast.success(
          `Invoice sent successfully to ${result.customerEmail}!${result.fallbackUsed ? ' (via backup method)' : ''}`, 
          { duration: 4000 }
        );
        
        // Show method used and remaining emails
        const methodText = result.method === 'gmail' ? 'Gmail (Professional)' : 'InvoicePort Mail';
        toast.info(`Sent via ${methodText}`, { duration: 2000 });
        
        if (result.remainingEmails !== 'unlimited') {
          toast.info(`Remaining emails: ${result.remainingEmails}`, { duration: 3000 });
        }
        
        // Refresh email usage stats
        const updatedUsage = await checkEmailUsageLimit();
        setEmailUsageStats(updatedUsage);
      } else {
        // Handle different error types
        if (result.reason === 'usage_limit_exceeded') {
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Email Limit Reached</span>
              <span className="text-xs">{result.error}</span>
            </div>, 
            { duration: 5000 }
          );
        } else if (result.reason === 'method_restricted') {
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Feature Restricted</span>
              <span className="text-xs">{result.error}</span>
            </div>, 
            { duration: 5000 }
          );
        } else {
          toast.error(`Failed to send email: ${result.error}`, { duration: 4000 });
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.', { duration: 3000 });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleTemplateSelect = (templateNumber) => {
    setSelectedTemplateId(templateNumber);
    setIsTemplateModalOpen(false);
    const companyDataWithBranding = { ...yourCompany, logoUrl: brandingSettings.logoUrl, tagline: brandingSettings.brandingTagline };
    const formData = {
      billTo, shipTo, invoice: { ...invoice, taxType, enableRoundOff, roundOffAmount }, 
      yourCompany: companyDataWithBranding, items, taxPercentage, taxAmount, subTotal, grandTotal, notes, selectedCurrency,
    };
    navigate("/template", { state: { formData, selectedTemplate: templateNumber } });
  };

  const fillDummyData = () => {
    setBillTo({ name: "John Doe", address: "123 Main St, Anytown, USA", phone: "(555) 123-4567", email: "john.doe@example.com" });
    setShipTo({ name: "Jane Smith", address: "456 Elm St, Othertown, USA", phone: "(555) 987-6543" });
    setInvoice(prev => ({
      ...prev,
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
      paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB').replace(/\//g, '/'),
    }));
    setYourCompany(prev => ({
      ...prev,
      name: brandingSettings.brandingCompanyName || "Your Business Name",
      address: brandingSettings.address || "101 Main St, Tech City",
      phone: brandingSettings.phone || "+91 999 888 7777",
      website: brandingSettings.brandingWebsite || "example.com"
    }));
    setItems([
      { name: "Website Design", description: "Homepage and 3 interior pages.", quantity: 1, amount: 5000, total: 5000, },
      { name: "SEO Optimization", description: "Initial keyword research and setup.", quantity: 10, amount: 50, total: 500, },
    ]);
    setTaxPercentage(18);
    setNotes("Thank you for your business!");
  };

  const clearForm = () => {
    setBillTo({ name: "", address: "", phone: "", email: "" });
    setShipTo({ name: "", address: "", phone: "" });
    setInvoice({
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
      paymentDate: "",
      number: generateSecureInvoiceNumber('INV', 6),
    });
    
    // Resetting yourCompany to only contain branding defaults if they exist
    setYourCompany({ 
        name: brandingSettings.brandingCompanyName || "", 
        address: brandingSettings.address || "", 
        phone: brandingSettings.phone || "", 
        website: brandingSettings.brandingWebsite || "" 
    });
    
    setItems(getInitialItems()); // Reset items to the initial single blank row
    setTaxPercentage(0);
    setNotes("");
  };
  
  // --- SIDEBAR COMPONENT ---
  const TotalsSummary = () => (
    <div className="w-full space-y-6">
        
        {/* USAGE CARD - Extracted and placed in main render */}
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 border-b border-indigo-100">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    Invoice Summary
                </h3>
            </div>

            <div className="p-5 space-y-6">
                <Button onClick={handleSaveToDatabase} disabled={isSaving || (!isAdmin && usageStats.count >= usageStats.limit)} className={`w-full font-bold h-11 text-md shadow-md transition-all ${(!isAdmin && usageStats.count >= usageStats.limit) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200'}`}>
                    {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                    {isSaving ? 'Saving...' : 'Save Invoice'}
                </Button>

                {/* Send Mail Button */}
                <Button 
                    onClick={handleSendEmail} 
                    disabled={isSendingEmail || !billTo.email || !user?.id || (emailUsageStats && !emailUsageStats.canSendEmail && !emailUsageStats.isAdmin)}
                    className={`w-full font-bold h-11 text-md shadow-md transition-all ${
                        !billTo.email 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : (emailUsageStats && !emailUsageStats.canSendEmail && !emailUsageStats.isAdmin)
                            ? 'bg-red-300 text-red-700 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-200'
                    }`}
                >
                    {isSendingEmail ? (
                        <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Mail size={18} className="mr-2" />
                            Send Mail
                        </>
                    )}
                </Button>

                {/* Email Status Info */}
                {!billTo.email && (
                    <div className="text-xs text-gray-500 text-center">
                        Add customer email to send invoice
                    </div>
                )}
                
                {billTo.email && emailUsageStats && !emailUsageStats.canSendEmail && !emailUsageStats.isAdmin && (
                    <div className="text-xs text-center">
                        <div className="text-red-600 font-medium">
                            Email limit reached ({emailUsageStats.currentUsage}/{emailUsageStats.emailLimit})
                        </div>
                        <div className="text-gray-500 mt-1">
                            Upgrade to Pro for unlimited emails
                        </div>
                    </div>
                )}
                
                {billTo.email && emailUsageStats && (emailUsageStats.canSendEmail || emailUsageStats.isAdmin) && (
                    <div className="text-xs text-center">
                        {emailUsageStats.isAdmin ? (
                            <div className="text-emerald-600 font-medium">
                                🛡️ Admin: Unlimited emails
                            </div>
                        ) : emailUsageStats.isPro ? (
                            <div className="text-emerald-600 font-medium">
                                ✨ Pro Plan: Unlimited emails
                            </div>
                        ) : (
                            <div className="text-gray-600">
                                Remaining: {emailUsageStats.emailLimit - emailUsageStats.currentUsage} emails
                            </div>
                        )}
                        <div className="text-gray-500 mt-1">
                            Will send via: {emailUsageStats?.isAdmin || emailUsageStats?.isPro ? 'Gmail / InvoicePort Mail' : 'InvoicePort Mail'}
                        </div>
                    </div>
                )}

                {/* INVOICE MODE & TAX CONFIGURATION */}
                <div className="grid grid-cols-3 gap-3 pt-2 pb-2">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Invoice Type</label>
                        <Select value={invoiceMode} onValueChange={setInvoiceMode}>
                            <SelectTrigger className="w-full h-8 text-xs bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="proforma">Proforma (Before Payment)</SelectItem>
                                <SelectItem value="tax_invoice">Tax Invoice (After Payment)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Tax Type</label>
                        <Select value={taxType} onValueChange={setTaxType}>
                            <SelectTrigger className="w-full h-8 text-xs bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IGST">IGST (Single)</SelectItem>
                                <SelectItem value="CGST_SGST">CGST + SGST</SelectItem>
                                <SelectItem value="PLAIN">Standard Tax</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Round Off</label>
                        <div className="h-8 flex items-center px-2 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100" onClick={() => setEnableRoundOff(!enableRoundOff)}>
                            {enableRoundOff ? <ToggleRight className="w-5 h-5 text-indigo-600 mr-2" /> : <ToggleLeft className="w-5 h-5 text-gray-400 mr-2" />}
                            <span className={`text-xs font-medium ${enableRoundOff ? 'text-indigo-700' : 'text-gray-500'}`}>{enableRoundOff ? 'On' : 'Off'}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 pb-4 border-b border-dashed border-gray-200 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Sub Total</span>
                        <span className="font-medium text-gray-900">{formatCurrency(subTotal, selectedCurrency)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span className="flex items-center gap-1">Tax Rate <span className="text-xs text-gray-400">(%)</span></span>
                        <input
                            type="number"
                            value={taxPercentage}
                            onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                            className="w-14 p-1 text-right border border-gray-300 rounded bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            min="0"
                            max="100"
                        />
                    </div>

                    {/* DYNAMIC TAX DISPLAY */}
                    {taxPercentage > 0 && (
                        <div className="pl-2 border-l-2 border-indigo-100 space-y-1">
                            {taxType === 'IGST' ? (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>IGST ({taxPercentage}%)</span>
                                    <span className="font-medium text-red-500">+{formatCurrency(taxAmount, selectedCurrency)}</span>
                                </div>
                            ) : taxType === 'CGST_SGST' ? (
                                <>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>CGST ({taxPercentage/2}%)</span>
                                        <span>+{formatCurrency(taxAmount/2, selectedCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>SGST ({taxPercentage/2}%)</span>
                                        <span>+{formatCurrency(taxAmount/2, selectedCurrency)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tax ({taxPercentage}%)</span>
                                    <span className="font-medium text-red-500">+{formatCurrency(taxAmount, selectedCurrency)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {enableRoundOff && (
                        <div className="flex justify-between text-sm text-gray-500 italic">
                            <span>Round Off</span>
                            <span>{roundOffAmount > 0 ? '+' : ''}{formatCurrency(roundOffAmount, selectedCurrency)}</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                        <span className="text-base font-bold text-gray-800">Total</span>
                        <span className="text-xl font-bold text-indigo-600">{formatCurrency(grandTotal, selectedCurrency)}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tools & Options</div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={clearForm} variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"><FiTrash2 className="mr-2 h-3.5 w-3.5" /> Clear</Button>
                        <Button onClick={fillDummyData} variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"><FiEdit className="mr-2 h-3.5 w-3.5" /> Demo</Button>
                    </div>
                    <Button onClick={() => setIsTemplateModalOpen(true)} variant="secondary" className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"><FiLayers size={16} className="mr-2" /> Change Template</Button>
                </div>
            </div>
        </div>
</div>
  );

  return (
    <>
      <SEO 
        title="Dashboard"
        description="Create and manage your invoices."
        noIndex={true}
        noFollow={true}
      />
      <Navigation /> 
      <div className="bg-slate-50 min-h-screen font-sans text-gray-900 pb-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">          
          
          {/* HEADER ROW */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Title */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">New Invoice</h1>
                <p className="text-gray-500 mt-1 text-sm">Create and manage your financial documents.</p>
            </div>
            
            {/* Invoice ID & Status Cards */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Invoice ID Badge */}
                <div className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-mono text-gray-600 shadow-sm">
                    ID: <span className="font-bold text-indigo-600">{invoice.number}</span>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-indigo-50/50 px-3 py-2 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {isAdmin ? <ShieldCheck className="w-4 h-4 text-indigo-600" /> : <Clock className="w-4 h-4 text-indigo-600" />}
                            <span className="font-semibold text-indigo-900 text-xs">
                                {isAdmin ? "ADMIN ACCESS" : "ACCOUNT STATUS"}
                            </span>
                        </div>
                        {!isAdmin && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${usageStats.daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {usageStats.daysLeft} Days Left
                            </span>
                        )}
                    </div>
                    
                    {!isAdmin && (
                        <div className="px-3 py-2 space-y-1">
                            <div className="flex justify-between text-xs font-medium text-gray-500">
                                <span>Invoices Created</span>
                                <span className={usageStats.count >= usageStats.limit ? "text-red-600 font-bold" : "text-gray-700"}>
                                    {usageStats.count} / {usageStats.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div 
                                    className={`h-1.5 rounded-full transition-all duration-500 ${usageStats.count >= usageStats.limit ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${Math.min((usageStats.count / usageStats.limit) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    {isAdmin && (
                        <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-500" /> Unlimited creation enabled
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 1. MAIN FORM CONTENT */}
            <div className="w-full lg:w-3/4 space-y-6">
                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={(e) => e.preventDefault()}>
                        {/* Client Details */}
                        <div className="p-6 md:p-8 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2"><div className="p-1.5 bg-blue-50 rounded text-blue-600"><User className="w-4 h-4" /></div> Client & Shipping Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <BillToSection billTo={billTo} handleInputChange={handleInputChange(setBillTo)} />
                                <ShipToSection shipTo={shipTo} handleInputChange={handleInputChange(setShipTo)} billTo={billTo} />
                            </div>
                        </div>

                        {/* Invoice Info */}
                        <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/30">
                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2"><div className="p-1.5 bg-indigo-50 rounded text-indigo-600"><FileText className="w-4 h-4" /></div> Document Information</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dates & ID</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FloatingLabelInput id="invoiceNumber" label="Invoice Number" value={invoice.number} onChange={handleInputChange(setInvoice)} name="number" />
                                        <FloatingLabelInput id="invoiceDate" label="Issue Date (DD/MM/YYYY)" type="text" placeholder="DD/MM/YYYY" value={invoice.date} onChange={handleInputChange(setInvoice)} name="date" />
                                        <FloatingLabelInput id="paymentDate" label="Due Date (DD/MM/YYYY)" type="text" placeholder="DD/MM/YYYY" value={invoice.paymentDate} onChange={handleInputChange(setInvoice)} name="paymentDate" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sender Info</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Company Name */}
                                        <FloatingLabelInput id="yourCompanyName" label="Company Name" value={yourCompany.name} onChange={handleInputChange(setYourCompany)} name="name" />
                                        {/* Phone Number */}
                                        <FloatingLabelInput id="yourCompanyPhone" label="Phone Number" value={yourCompany.phone} onChange={handleInputChange(setYourCompany)} name="phone" />
                                        {/* Address */}
                                        <FloatingLabelInput id="yourCompanyAddress" label="Address" value={yourCompany.address} onChange={handleInputChange(setYourCompany)} name="address" className="sm:col-span-2" />
                                        {/* Website */}
                                        <FloatingLabelInput id="yourCompanyWebsite" label="Website" value={yourCompany.website} onChange={handleInputChange(setYourCompany)} name="website" type="url" className="sm:col-span-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="p-6 md:p-8 border-b border-gray-100">
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><div className="p-1.5 bg-green-50 rounded text-green-600"><ShoppingBag className="w-4 h-4" /></div> Line Items</h2>
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
                            </div>
                            <ItemDetails items={items} handleItemChange={handleItemChange} removeItem={removeItem} addItem={addItem} currencyCode={selectedCurrency} />
                        </div>

                        {/* Notes */}
                        <div className="p-6 md:p-8 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><div className="p-1.5 bg-orange-50 rounded text-orange-600"><StickyNote className="w-4 h-4" /></div> Terms & Notes</h2>
                                <Button type="button" variant="ghost" size="sm" onClick={refreshNotes} className="text-indigo-600 hover:bg-indigo-50 h-8 text-xs"><RefreshCw size={12} className="mr-1.5" /> Auto-Generate</Button>
                            </div>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white text-sm text-gray-700 min-h-[100px] resize-y shadow-sm" placeholder="Enter payment terms, thank you notes, or additional instructions..."></textarea>
                        </div>
                    </form>
                </div>
            </div>
            
            <div className="w-full lg:w-1/4 min-w-[300px] sticky top-24 self-start"> 
                <TotalsSummary />
            </div>
          </div>
        </div>
      </div>
   
      {/* TEMPLATE SELECTION MODAL */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-5xl p-8 bg-slate-50">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">Choose a Template</DialogTitle>
                <p className="text-gray-500 text-sm">Select a professional design for your invoice.</p>
            </DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 max-h-[60vh] overflow-y-auto p-2">
                {templates.map((template, index) => (
                    <TemplatePreview
                        key={index}
                        templateIndex={index}
                        onClick={() => handleTemplateSelect(index + 1)}
                    />
                ))}
            </div>
        </DialogContent>
      </Dialog> 
    </>
  );
};

export default Index;