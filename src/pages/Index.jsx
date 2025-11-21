import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatCurrency'; 
import FloatingLabelInput from '../components/FloatingLabelInput';
import BillToSection from '../components/BillToSection';
import ShipToSection from '../components/ShipToSection';
import ItemDetails from "../components/ItemDetails";
import { templates } from "../utils/templateRegistry";
import { FiEdit, FiTrash2, FiLayers } from "react-icons/fi"; 
import { RefreshCw, Save, Loader2, DollarSign, User, FileText, ShoppingBag, StickyNote, Clock, AlertCircle, ShieldCheck, ToggleRight, ToggleLeft } from "lucide-react"; 
import Navigation from '../components/Navigation';
import { Button } from '@/components/ui/button'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 

const generateRandomInvoiceNumber = () => {
  const length = Math.floor(Math.random() * 6) + 3;
  const alphabetCount = Math.min(Math.floor(Math.random() * 4), length);
  let result = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  for (let i = 0; i < alphabetCount; i++) result += alphabet[Math.floor(Math.random() * alphabet.length)];
  for (let i = alphabetCount; i < length; i++) result += numbers[Math.floor(Math.random() * numbers.length)];
  return result;
};

const noteOptions = [
  "Thank you for choosing us today! We hope your shopping experience was pleasant.",
  "Payment is due within 30 days. Please include the invoice number on your check.",
  "We appreciate your business and look forward to serving you again.",
  "Please make checks payable to the company name listed above.",
  "Thank you for your prompt payment."
];

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false); 
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Usage State
  const [usageStats, setUsageStats] = useState({
      count: 0,
      limit: 10,
      trialEnds: null,
      planName: 'Loading...',
      daysLeft: 0
  });

  const [brandingSettings, setBrandingSettings] = useState({
    logoUrl: '',
    brandingCompanyName: '',
    brandingWebsite: '',
  });

  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [billTo, setBillTo] = useState({ name: "", address: "", phone: "" });
  const [shipTo, setShipTo] = useState({ name: "", address: "", phone: "" });
  const [invoice, setInvoice] = useState({
    date: new Date().toISOString().split('T')[0],
    paymentDate: "",
    number: generateRandomInvoiceNumber(),
  });
  const [yourCompany, setYourCompany] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
  });
  const [items, setItems] = useState([]);
  
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

  // 1. INITIAL DATA FETCH (Admin Check & Branding Metadata)
  useEffect(() => {
    const initData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let adminStatus = false;
            const adminEmails = ['nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com'];
            if (adminEmails.includes(user.email)) {
                adminStatus = true;
            } else {
                const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
                if (roleData) adminStatus = true;
            }
            setIsAdmin(adminStatus);

            // B. Fetch Branding (Metadata Only)
            const { data: branding } = await supabase.from('branding_settings').select('*').eq('user_id', user.id).maybeSingle();
            if (branding) {
                const fetchedCompanyName = branding.company_name || '';
                const fetchedWebsite = branding.website || '';

                setBrandingSettings({
                    logoUrl: branding.logo_url || '',
                    brandingCompanyName: fetchedCompanyName,
                    brandingWebsite: fetchedWebsite,
                });
                
                // FIX: If there's no saved draft in localStorage AND we got non-empty branding data, 
                // set the company info based on what the user saved in branding settings.
                const savedFormData = localStorage.getItem("formData");
                
                if (!savedFormData && (fetchedCompanyName || fetchedWebsite)) {
                    setYourCompany(prev => ({
                        ...prev,
                        name: fetchedCompanyName,
                        website: fetchedWebsite,
                    }));
                }
            }

            // C. Fetch Usage & Subscription (Rest of the logic)
            const { data: sub } = await supabase.from('user_subscriptions').select('*, subscription_plans(*)')
                .eq('user_id', user.id).maybeSingle();

            let daysLeft = 0;
            if (sub?.current_period_end) {
                const end = new Date(sub.current_period_end);
                const now = new Date();
                daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
            }

            const currentCount = sub?.invoice_usage_count || 0;
            const limit = sub?.subscription_plans?.slug === 'trial' ? 10 : 10000;

            setUsageStats({
                count: currentCount,
                limit: limit,
                planName: sub?.subscription_plans?.name || 'Free Trial',
                daysLeft: daysLeft > 0 ? daysLeft : 0
            });

        } catch (error) {
            console.error("Error initializing data:", error);
        }
    };
    initData();
  }, []); // Empty dependency array is intentional to run once

  // 2. LOAD FORM DATA (History OR Draft)
  useEffect(() => {
    // Option A: Load from History (passed via navigation state)
    if (location.state && location.state.invoiceData) {
        const data = location.state.invoiceData;
        setBillTo(data.billTo || { name: "", address: "", phone: "" });
        setShipTo(data.shipTo || { name: "", address: "", phone: "" });
        setInvoice(data.invoice ? { ...data.invoice, number: generateRandomInvoiceNumber() } : { date: new Date().toISOString().split('T')[0], paymentDate: "", number: generateRandomInvoiceNumber() });
        setYourCompany(data.yourCompany || { name: "", address: "", phone: "", website: "" });
        setItems(data.items || []);
        
        setTaxPercentage(data.taxPercentage || 0);
        setTaxType(data.taxType || "IGST");
        setEnableRoundOff(data.enableRoundOff || false);
        
        setNotes(data.notes || "");
        setSelectedCurrency(data.selectedCurrency || "INR");
        toast.info("Invoice details loaded.");
    } 
    // Option B: Load from Local Storage (Draft) - This runs only if no history data is present
    else {
        const savedFormData = localStorage.getItem("formData");
        if (savedFormData) {
            const parsedData = JSON.parse(savedFormData);
            setBillTo(parsedData.billTo || { name: "", address: "", phone: "" });
            setShipTo(parsedData.shipTo || { name: "", address: "", phone: "" });
            setInvoice(parsedData.invoice || { date: new Date().toISOString().split('T')[0], paymentDate: "", number: generateRandomInvoiceNumber() });
            
            // FIX: Ensure if local storage is blank, we don't accidentally load old state values.
            const initialYourCompany = parsedData.yourCompany || { name: "", address: "", phone: "", website: "" };
            setYourCompany(initialYourCompany);

            setItems(parsedData.items || []);
            
            setTaxPercentage(parsedData.taxPercentage || 0);
            setTaxType(parsedData.taxType || "IGST");
            setEnableRoundOff(parsedData.enableRoundOff || false);

            setNotes(parsedData.notes || "");
            setSelectedCurrency(parsedData.selectedCurrency || "INR"); 
        } else {
            // If no local storage data exists, ensure all sender fields are truly empty
            setYourCompany({ name: "", address: "", phone: "", website: "" });
            setItems([]);
        }
    }
  }, [location.state]);

  // 3. SAVE DRAFT
  useEffect(() => {
    const formData = {
      billTo, shipTo, invoice, yourCompany, items, taxPercentage, taxType, enableRoundOff, taxAmount, subTotal, grandTotal, notes, selectedCurrency,
    };
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [billTo, shipTo, invoice, yourCompany, items, taxPercentage, taxType, enableRoundOff, notes, taxAmount, subTotal, grandTotal, selectedCurrency]);

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
    
    if (!isAdmin && usageStats.count >= usageStats.limit) {
        toast.error(<div className="flex flex-col gap-1"><span className="font-bold">Limit Reached (10/10)</span><span className="text-xs">Upgrade to create more.</span></div>);
        setIsSaving(false);
        return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save invoices.');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        invoice_number: invoice.number,
        bill_to: billTo,
        ship_to: shipTo,
        invoice_details: invoice,
        from_details: { ...yourCompany, logo_url: brandingSettings.logoUrl },
        items: items,
        tax: taxPercentage,
        invoice_details: { 
            ...invoice, 
            taxType, 
            enableRoundOff, 
            roundOffAmount 
        },
        subtotal: subTotal,
        grand_total: grandTotal,
        notes: notes,
        template_name: templates[0]?.name || 'Template 1', 
      });

      if (error) throw error;

      await supabase.rpc('increment_invoice_usage');
      setUsageStats(prev => ({ ...prev, count: prev.count + 1 }));
      toast.success('Invoice saved successfully!');
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateSelect = (templateNumber) => {
    setIsTemplateModalOpen(false);
    const companyDataWithBranding = { ...yourCompany, logoUrl: brandingSettings.logoUrl };
    const formData = {
      billTo, shipTo, invoice: { ...invoice, taxType, enableRoundOff, roundOffAmount }, 
      yourCompany: companyDataWithBranding, items, taxPercentage, taxAmount, subTotal, grandTotal, notes, selectedCurrency,
    };
    navigate("/template", { state: { formData, selectedTemplate: templateNumber } });
  };

  const fillDummyData = () => {
    setBillTo({ name: "John Doe", address: "123 Main St, Anytown, USA", phone: "(555) 123-4567" });
    setShipTo({ name: "Jane Smith", address: "456 Elm St, Othertown, USA", phone: "(555) 987-6543" });
    setItems([{ name: "Product A", description: "High-quality item", quantity: 2, amount: 50, total: 100 }]);
    setTaxPercentage(18);
    setNotes("Thank you for your business!");
  };

  const clearForm = () => {
    setBillTo({ name: "", address: "", phone: "" });
    setShipTo({ name: "", address: "", phone: "" });
    setInvoice({
      date: new Date().toISOString().split("T")[0],
      paymentDate: "",
      number: generateRandomInvoiceNumber(),
    });
    
    // Resetting yourCompany to empty strings, respecting branding only if non-empty
    setYourCompany(prev => ({ 
        name: brandingSettings.brandingCompanyName || "", 
        address: "", 
        phone: "", 
        website: brandingSettings.brandingWebsite || "" 
    }));
    
    setItems([{ name: "", description: "", quantity: 0, amount: 0, total: 0 }]);
    setTaxPercentage(0);
    setNotes("");
    localStorage.removeItem("formData");
  };
  
  // --- SIDEBAR COMPONENT ---
  const TotalsSummary = () => (
    <div className="w-full space-y-6 sticky top-24">
        
        {/* USAGE CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-indigo-50/50 p-4 border-b border-indigo-50 flex justify-between items-center">
                <h4 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
                    {isAdmin ? <ShieldCheck className="w-4 h-4 text-indigo-600" /> : <Clock className="w-4 h-4 text-indigo-600" />}
                    {isAdmin ? "Admin Access" : "Account Status"}
                </h4>
                {!isAdmin && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${usageStats.daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {usageStats.daysLeft} Days Left
                    </span>
                )}
             </div>
             
             {!isAdmin && (
                 <div className="p-4 space-y-3">
                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                        <span>Invoices Created</span>
                        <span className={usageStats.count >= usageStats.limit ? "text-red-600 font-bold" : "text-gray-700"}>
                            {usageStats.count} / {usageStats.limit}
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-500 ${usageStats.count >= usageStats.limit ? 'bg-red-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min((usageStats.count / usageStats.limit) * 100, 100)}%` }}
                        ></div>
                    </div>
                    
                    {usageStats.count >= usageStats.limit && (
                        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>Limit reached.</span>
                        </div>
                    )}
                 </div>
             )}
             
             {isAdmin && (
                 <div className="p-4 text-xs text-gray-500 flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-green-500" /> Unlimited creation enabled.
                 </div>
             )}
        </div>

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

                {/* TAX CONFIGURATION */}
                <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
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
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Rounding</label>
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
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                        <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                            <SelectTrigger className="w-full h-8 text-xs bg-gray-50 border-gray-200"><SelectValue placeholder="Currency" /></SelectTrigger>
                            <SelectContent><SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem></SelectContent>
                        </Select>
                    </div>
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
      <Navigation /> 
      <div className="bg-slate-50 min-h-screen font-sans text-gray-900 pb-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">          
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">New Invoice</h1>
                <p className="text-gray-500 mt-1 text-sm">Create and manage your financial documents.</p>
            </div>
            <div className="mt-4 md:mt-0 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-mono text-gray-600 shadow-sm">
                ID: <span className="font-bold text-indigo-600">{invoice.number}</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 1. MAIN FORM */}
            <div className="w-full lg:w-3/4 space-y-6">
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
                                        <FloatingLabelInput id="invoiceDate" label="Issue Date" type="date" value={invoice.date} onChange={handleInputChange(setInvoice)} name="date" />
                                        <FloatingLabelInput id="paymentDate" label="Due Date" type="date" value={invoice.paymentDate} onChange={handleInputChange(setInvoice)} name="paymentDate" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sender Info</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FloatingLabelInput id="yourCompanyName" label="Company Name" value={yourCompany.name} onChange={handleInputChange(setYourCompany)} name="name" />
                                        <FloatingLabelInput id="yourCompanyPhone" label="Phone Number" value={yourCompany.phone} onChange={handleInputChange(setYourCompany)} name="phone" />
                                        <FloatingLabelInput id="yourCompanyAddress" label="Address" value={yourCompany.address} onChange={handleInputChange(setYourCompany)} name="address" className="sm:col-span-2" />
                                        <FloatingLabelInput id="yourCompanyWebsite" label="Website" value={yourCompany.website} onChange={handleInputChange(setYourCompany)} name="website" type="url" className="sm:col-span-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 border-b border-gray-100">
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><div className="p-1.5 bg-green-50 rounded text-green-600"><ShoppingBag className="w-4 h-4" /></div> Line Items</h2>
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
                            </div>
                            <ItemDetails items={items} handleItemChange={handleItemChange} removeItem={removeItem} addItem={addItem} currencyCode={selectedCurrency} />
                        </div>

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
            
            <div className="w-full lg:w-1/4 min-w-[300px]">
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
                    <div key={index} className="group relative bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500" onClick={() => handleTemplateSelect(index + 1)}>
                        <div className="aspect-[210/297] w-full bg-gray-100 relative overflow-hidden">
                             <img src={`/assets/template${index + 1}-preview.png`} alt={template.name} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </div>
                        <div className="p-3 text-center bg-white border-t border-gray-100"><p className="font-semibold text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">{template.name}</p></div>
                    </div>
                ))}
            </div>
        </DialogContent>
      </Dialog> 
    </>
  );
};

export default Index;