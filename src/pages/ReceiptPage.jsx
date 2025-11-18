import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, RefreshCw, FileText, RotateCw, Mail, Save, DollarSign, Download } from "lucide-react"; // Added Download icon
import { Button } from "@/components/ui/button";
import Receipt1 from "../components/templates/Receipt1";
import Receipt2 from "../components/templates/Receipt2";
import Receipt3 from "../components/templates/Receipt3";
import Receipt4 from "../components/templates/Receipt4";
import { formatCurrency } from "../utils/formatCurrency";
import { generateReceiptPDF } from "../utils/receiptPDFGenerator";
import { generateGSTNumber } from "../utils/invoiceCalculations";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ItemDetails from "../components/ItemDetails";
import Navigation from '../components/Navigation';

// Helper function definitions (generateRandomInvoiceNumber, footerOptions) remain the same
const generateRandomInvoiceNumber = () => {
  const length = Math.floor(Math.random() * 6) + 3;
  const alphabetCount = Math.min(Math.floor(Math.random() * 4), length);
  let result = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  for (let i = 0; i < alphabetCount; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  for (let i = alphabetCount; i < length; i++) {
    result += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return result;
};
const footerOptions = [
  "Thank you for choosing us today! We hope your shopping experience was pleasant and seamless. Your satisfaction matters to us, and we look forward to serving you again soon. Keep this receipt for any returns or exchanges.",
  "Your purchase supports our community! We believe in giving back and working towards a better future. Thank you for being a part of our journey. We appreciate your trust and hope to see you again soon.",
  "We value your feedback! Help us improve by sharing your thoughts on the text message survey link. Your opinions help us serve you better and improve your shopping experience. Thank thank you for shopping with us!",
  "Did you know you can save more with our loyalty program? Ask about it on your next visit and earn points on every purchase. It’s our way of saying thank you for being a loyal customer. See you next time!",
  "Need assistance with your purchase? We’re here to help! Reach out to our customer support, or visit our website for more information. We’re committed to providing you with the best service possible.",
  "Keep this receipt for returns or exchanges.",
  "Every purchase makes a difference! We are dedicated to eco-friendly practices and sustainability. Thank you for supporting a greener planet with us. Together, we can build a better tomorrow.",
  "Have a great day!",
  "“Thank you for shopping with us today. Did you know you can return or exchange your items within 30 days with this receipt? We want to ensure that you’re happy with your purchase, so don’t hesitate to come back if you need assistance.",
  "Eco-friendly business. This receipt is recyclable.",
  "We hope you enjoyed your shopping experience! Remember, for every friend you refer, you can earn exclusive rewards. Visit www.example.com/refer for more details. We look forward to welcoming you back soon!",
  "Thank you for choosing us! We appreciate your business and look forward to serving you again. Keep this receipt for any future inquiries or returns.",
  "Your purchase supports local businesses and helps us continue our mission. Thank you for being a valued customer. We hope to see you again soon!",
  "We hope you had a great shopping experience today. If you have any feedback, please share it with us on our website. We are always here to assist you.",
  "Thank you for your visit! Remember, we offer exclusive discounts to returning customers. Check your email for special offers on your next purchase.",
  "Your satisfaction is our top priority. If you need any help or have questions about your purchase, don’t hesitate to contact us. Have a great day!",
  "We love our customers! Thank you for supporting our business. Follow us on social media for updates on promotions and new products. See you next time!",
  "Every purchase counts! We are committed to making a positive impact, and your support helps us achieve our goals. Thank you for shopping with us today!",
  "We hope you found everything you needed. If not, please let us know so we can improve your experience. Your feedback helps us serve you better. Thank you!",
  "Thank you for visiting! Did you know you can save more with our rewards program? Ask about it during your next visit and start earning points today!",
  "We appreciate your trust in us. If you ever need assistance with your order, please visit our website or call customer service. We’re here to help!",
];
// -----------------------------------------------------------------------------

const ReceiptPage = () => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const receiptRef = useRef(null);
  
  // New state for branding data
  const [brandingSettings, setBrandingSettings] = useState({
    logoUrl: '',
    brandingCompanyName: '',
    brandingWebsite: '',
  });

  const [billTo, setBillTo] = useState("");
  const [invoice, setInvoice] = useState({
    date: "",
    number: generateRandomInvoiceNumber(),
  });
  const [yourCompany, setYourCompany] = useState({
    name: "",
    address: "",
    phone: "",
    gst: "",
    website: "",
  });
  const [cashier, setCashier] = useState("");
  const [items, setItems] = useState([
    { name: "", description: "", quantity: 0, amount: 0, total: 0 },
  ]);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [theme, setTheme] = useState("Receipt1");
  const [notes, setNotes] = useState("");
  const [footer, setFooter] = useState("Thank you");
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  const refreshFooter = () => {
    const randomIndex = Math.floor(Math.random() * footerOptions.length);
    setFooter(footerOptions[randomIndex]);
  };

  // --- Branding/Data Fetching Effect ---
  useEffect(() => {
    const fetchBranding = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('branding_settings')
                .select('company_name, website, logo_url')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setBrandingSettings({
                    logoUrl: data.logo_url || '',
                    brandingCompanyName: data.company_name || '',
                    brandingWebsite: data.website || '',
                });

                setYourCompany(prev => ({
                    ...prev,
                    name: prev.name || data.company_name || '',
                    website: prev.website || data.website || '',
                }));
            }
        } catch (error) {
            console.error("Error fetching branding settings:", error);
        } finally {
            setIsLoading(false); 
        }
    };
    fetchBranding();
  }, []);
  // ---------------------------------

  useEffect(() => {
    // Load form data from localStorage on component mount
    const savedFormData = localStorage.getItem("receiptFormData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setBillTo(parsedData.billTo || "");
      const initialYourCompany = parsedData.yourCompany || { name: "", address: "", phone: "", gst: "", website: "" };
      setYourCompany({
        ...initialYourCompany,
        name: initialYourCompany.name || brandingSettings.brandingCompanyName,
        website: initialYourCompany.website || brandingSettings.brandingWebsite,
      });
      setInvoice(parsedData.invoice || { date: "", number: generateRandomInvoiceNumber() });
      setCashier(parsedData.cashier || "");
      setItems(parsedData.items || [{ name: "", description: "", quantity: 0, amount: 0, total: 0 }]);
      setTaxPercentage(parsedData.taxPercentage || 0);
      setNotes(parsedData.notes || "");
      setFooter(parsedData.footer || "Thank you");
      setSelectedCurrency(parsedData.selectedCurrency || "INR");
    } else {
      // Initialize with default values if nothing in localStorage
      setInvoice((prev) => ({ ...prev, number: generateRandomInvoiceNumber() }));
      setItems([{ name: "", description: "", quantity: 0, amount: 0, total: 0 }]);
      // Apply branding defaults on initial load if no localStorage
      setYourCompany(prev => ({
        ...prev,
        name: brandingSettings.brandingCompanyName,
        website: brandingSettings.brandingWebsite,
      }));
    }
  }, [brandingSettings.brandingCompanyName, brandingSettings.brandingWebsite]);

  useEffect(() => {
    // Save form data to localStorage whenever it changes
    const formData = {
      billTo,
      invoice,
      yourCompany,
      cashier,
      items,
      taxPercentage,
      notes,
      footer,
      selectedCurrency,
    };
    localStorage.setItem("receiptFormData", JSON.stringify(formData));
  }, [billTo, invoice, yourCompany, cashier, items, taxPercentage, notes, footer, selectedCurrency]);

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save receipts.');
        setIsSaving(false);
        return;
      }

      const subTotal = calculateSubTotal(items);
      const taxAmount = calculateTaxAmount(subTotal, taxPercentage);
      const total = calculateGrandTotal(subTotal, taxAmount);

      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        invoice_number: invoice.number,
        bill_to: { name: billTo, email: '', address: '', phone: '' },
        invoice_details: invoice,
        from_details: { ...yourCompany, logo_url: brandingSettings.logoUrl },
        items: items,
        tax: taxPercentage,
        subtotal: subTotal,
        grand_total: total,
        notes: notes,
        template_name: theme,
      });

      if (error) throw error;
      toast.success('Receipt saved successfully!');

    } catch (error) {
      console.error("Error saving receipt:", error);
      toast.error('Failed to save receipt');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!isDownloading && receiptRef.current) {
      setIsDownloading(true);
      const receiptData = {
        billTo,
        invoice,
        yourCompany: { ...yourCompany, logoUrl: brandingSettings.logoUrl },
        cashier,
        items,
        taxPercentage,
        notes,
        footer,
        selectedCurrency,
      };
      try {
        await generateReceiptPDF(receiptRef.current, theme, receiptData);
        toast.success('Receipt downloaded successfully!');
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error('Failed to download receipt');
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleSendEmail = () => {
    const subTotal = calculateSubTotal(items);
    const taxAmount = calculateTaxAmount(subTotal, taxPercentage);
    const total = calculateGrandTotal(subTotal, taxAmount);
    
    const subject = `Receipt ${invoice.number}`;
    const body = `Dear Customer,\n\nPlease find your receipt details below:\n\nReceipt Number: ${invoice.number}\nDate: ${invoice.date}\nTotal: ${formatCurrency(total, selectedCurrency)}\n\n${notes}\n\nBest regards,\n${yourCompany.name}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleInputChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "quantity" || field === "amount") {
      newItems[index].total = newItems[index].quantity * newItems[index].amount;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", description: "", quantity: 0, amount: 0, total: 0 },
    ]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateSubTotal = (currentItems = items) => {
    return currentItems.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2);
  };

  const calculateTaxAmount = (subTotalStr = calculateSubTotal()) => {
    const subTotal = parseFloat(subTotalStr);
    return (subTotal * (taxPercentage / 100) || 0).toFixed(2);
  };

  const calculateGrandTotal = (subTotalStr = calculateSubTotal(), taxAmountStr = calculateTaxAmount()) => {
    const subTotal = parseFloat(subTotalStr) || 0;
    const taxAmount = parseFloat(taxAmountStr) || 0;
    return (subTotal + taxAmount).toFixed(2);
  };

  const companyDataWithBranding = {
    ...yourCompany,
    logoUrl: brandingSettings.logoUrl,
  };

  // --- RENDER CHECK (Critical Stability Fix) ---
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="ml-4 text-gray-700">Loading receipt data...</p>
        </div>
    );
  }
  // ----------------------------------------------


  return (
    <>
      {/* Navigation - Tailwind has replaced bg-blue-600 with a gradient and shadow */}
      <Navigation className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-2xl" />
      
      {/* Main Container with Background */}
      <div className="min-h-screen bg-gray-50 bg-opacity-70 backdrop-blur-sm pt-8 pb-16">
        {/* Background Overlay for a modern, subtle gradient look */}
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at top left, #a5b4fc, transparent), radial-gradient(circle at bottom right, #3b82f6, transparent)' }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* --- ACTION BAR (Modernized) --- */}
          <div className="mb-12 p-5 bg-white shadow-3xl rounded-xl border border-blue-100/50"> 
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  
                  {/* Left Side: Navigation & Info */}
                  <div className="flex gap-4 items-center">
                      <Button
                          onClick={() => navigate("/")}
                          className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-lg px-4 transition-all duration-300"
                          aria-label="Switch to Bill Generator"
                      >
                          <FileText size={16} className="mr-2" />
                          Go to Invoice
                      </Button>
                      <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-lg text-gray-800 font-semibold border border-blue-200">
                          <DollarSign size={16} className="text-green-600" />
                          <span>Currency: {selectedCurrency}</span>
                      </div>
                  </div>
                  
                  {/* Right Side: Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                      
                      {/* EMAIL BUTTON */}
                      <Button
                          onClick={handleSendEmail}
                          className="bg-purple-600 hover:bg-purple-700 font-semibold shadow-lg px-4 text-white transition-all duration-300" 
                          aria-label="Send Email"
                      >
                          <Mail size={16} className="mr-2" />
                          Email Receipt
                      </Button>

                      {/* SAVE BUTTON */}
                      <Button
                          onClick={handleSaveToDatabase}
                          disabled={isSaving}
                          className="bg-green-600 hover:bg-green-700 font-semibold shadow-lg px-4 text-white transition-all duration-300" 
                          aria-label="Save to Database"
                      >
                          {isSaving ? (
                              <Loader2 size={16} className="animate-spin mr-2" />
                          ) : (
                              <Save size={16} className="mr-2" />
                          )}
                          Save to DB
                      </Button>

                      {/* DOWNLOAD BUTTON */}
                      <Button
                          onClick={handleDownloadPDF}
                          disabled={isDownloading}
                          className="bg-red-500 hover:bg-red-600 font-semibold shadow-lg px-4 text-white transition-all duration-300"
                      >
                          {isDownloading ? (
                              <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                              </>
                          ) : (
                              <>
                                  <Download size={16} className="mr-2" />
                                  Download PDF
                              </>
                          )}
                      </Button>
                  </div>
              </div>
          </div>
          {/* --- END ACTION BAR --- */}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- INPUT FORM SECTION (2/3 width on large screens) --- */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-3xl border border-gray-100/70">
                <form>
                    
                    {/* Your Company & Cashier */}
                    <div className="mb-8 border-b border-dashed pb-6">
                        <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center">
                            <span className="p-2 bg-indigo-100 rounded-full mr-3">🏢</span> Your Company & Cashier
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FloatingLabelInput
                                id="yourCompanyName"
                                label="Name"
                                value={yourCompany.name}
                                onChange={handleInputChange(setYourCompany)}
                                name="name"
                            />
                            <FloatingLabelInput
                                id="yourCompanyPhone"
                                label="Phone"
                                value={yourCompany.phone}
                                onChange={handleInputChange(setYourCompany)}
                                name="phone"
                            />
                        </div>
                        <FloatingLabelInput
                            id="yourCompanyAddress"
                            label="Address"
                            value={yourCompany.address}
                            onChange={handleInputChange(setYourCompany)}
                            name="address"
                            className="mt-4"
                        />
                        <div className="relative mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <FloatingLabelInput
                                    id="yourCompanyGST"
                                    label="GST No."
                                    value={yourCompany.gst}
                                    onChange={(e) => {
                                        const value = e.target.value.slice(0, 15);
                                        handleInputChange(setYourCompany)({
                                            target: { name: "gst", value },
                                        });
                                    }}
                                    name="gst"
                                    maxLength={15}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newGST = generateGSTNumber();
                                        setYourCompany(prev => ({ ...prev, gst: newGST }));
                                    }}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="Generate new GST number"
                                >
                                    <RotateCw size={16} />
                                </button>
                            </div>
                            <FloatingLabelInput
                                id="yourCompanyWebsite"
                                label="Website"
                                value={yourCompany.website}
                                onChange={handleInputChange(setYourCompany)}
                                name="website"
                            />
                        </div>
                        <FloatingLabelInput
                            id="cashier"
                            label="Cashier"
                            value={cashier}
                            onChange={(e) => setCashier(e.target.value)}
                            name="cashier"
                            className="mt-4"
                        />
                    </div>

                    {/* Customer & Receipt ID */}
                    <div className="mb-8 border-b border-dashed pb-6">
                        <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center">
                            <span className="p-2 bg-indigo-100 rounded-full mr-3">👤</span> Customer & Receipt ID
                        </h2>
                        <FloatingLabelInput
                            id="billTo"
                            label="Customer Name / Bill To"
                            value={billTo}
                            onChange={(e) => setBillTo(e.target.value)}
                            name="billTo"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FloatingLabelInput
                                id="invoiceNumber"
                                label="Receipt Number"
                                value={invoice.number}
                                onChange={handleInputChange(setInvoice)}
                                name="number"
                            />
                            <FloatingLabelInput
                                id="invoiceDate"
                                label="Date"
                                type="date"
                                value={invoice.date}
                                onChange={handleInputChange(setInvoice)}
                                name="date"
                            />
                        </div>
                    </div>

                    {/* Item Details */}
                    <div className="mt-4 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-indigo-700 border-b border-dashed pb-2 flex items-center">
                            <span className="p-2 bg-indigo-100 rounded-full mr-3">🛒</span> Items Sold
                        </h2>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-gray-200 p-3 rounded-lg bg-gray-50/50"> 
                            <ItemDetails
                                items={items}
                                handleItemChange={handleItemChange}
                                removeItem={removeItem}
                                currencyCode={selectedCurrency}
                            />
                        </div>
                        <div className="mt-4"> 
                            <Button 
                                onClick={addItem}
                                variant="outline"
                                type="button"
                                className="w-full border-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50/50 transition-colors"
                            >
                                + Add Item
                            </Button>
                        </div>
                    </div>

                    {/* Totals & Notes */}
                    <div className="mt-8 border-t border-dashed pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-indigo-700">Totals Summary</h3>
                            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex justify-between text-lg font-medium">
                                    <span>Sub Total:</span>
                                    <span>{formatCurrency(calculateSubTotal(), selectedCurrency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-medium">
                                    <span>Tax (%):</span>
                                    <input
                                        type="number"
                                        value={taxPercentage}
                                        onChange={(e) =>
                                            setTaxPercentage(parseFloat(e.target.value) || 0)
                                        }
                                        className="w-20 p-1 border border-gray-300 rounded text-right focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        min="0"
                                        max="28"
                                        step="1"
                                    />
                                </div>
                                <div className="flex justify-between border-b border-blue-300 pb-3 text-lg font-medium">
                                    <span>Tax Amount:</span>
                                    <span>{formatCurrency(calculateTaxAmount(), selectedCurrency)}</span>
                                </div>
                                <div className="flex justify-between font-extrabold text-3xl pt-3 border-t border-blue-300">
                                    <span>Grand Total:</span>
                                    <span className="text-green-700">{formatCurrency(calculateGrandTotal(), selectedCurrency)}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center mb-2">
                                <h3 className="text-xl font-bold text-indigo-700">Notes & Footer Message</h3>
                                <button
                                    type="button"
                                    onClick={refreshFooter}
                                    className="ml-2 p-1 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="Refresh footer"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                rows="3"
                                placeholder="Notes for the customer (e.g., payment method)..."
                            ></textarea>
                            <textarea
                                value={footer}
                                onChange={(e) => setFooter(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-blue-500 focus:border-blue-500 transition-all"
                                rows="2"
                                placeholder="Footer message (e.g., Thank you for your business)."
                            ></textarea>
                        </div>
                    </div>
                </form>
            </div>

            {/* --- PREVIEW SECTION (1/3 width on large screens) --- */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-3xl border border-gray-100/70 sticky top-4">
                <h2 className="text-2xl font-bold mb-6 text-indigo-700 flex items-center">
                    <span className="p-2 bg-indigo-100 rounded-full mr-3">🎨</span> Receipt Preview
                </h2>
                
                {/* Style Selection */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Receipt Style Selection</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {["Receipt1", "Receipt2", "Receipt3", "Receipt4"].map((rName) => (
                            <label key={rName} className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${theme === rName ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-blue-50 border'}`}>
                                <input type="radio" name="theme" value={rName} checked={theme === rName} onChange={() => setTheme(rName)} className="mr-2" />
                                {rName.replace('Receipt', 'Style ')}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Receipt Preview Window */}
                <div ref={receiptRef} className="w-full max-w-[380px] mx-auto border-4 border-gray-900 rounded-md shadow-2xl overflow-hidden mt-6 bg-white">
                    {theme === "Receipt1" && (
                        <Receipt1 data={{ billTo, invoice, yourCompany: companyDataWithBranding, cashier, items, taxPercentage, notes, footer, selectedCurrency, }} />
                    )}
                    {theme === "Receipt2" && (
                        <Receipt2 data={{ billTo, invoice, yourCompany: companyDataWithBranding, cashier, items, taxPercentage, notes, footer, selectedCurrency, }} />
                    )}
                    {theme === "Receipt3" && (
                        <Receipt3 data={{ billTo, invoice, yourCompany: companyDataWithBranding, cashier, items, taxPercentage, notes, footer, selectedCurrency, }} />
                    )}
                    {theme === "Receipt4" && (
                        <Receipt4 data={{ billTo, invoice, yourCompany: companyDataWithBranding, items, taxPercentage, footer, cashier, selectedCurrency, }} />
                    )}
                </div>
                <p className="text-center text-sm text-gray-500 mt-4 italic">
                    Preview size is fixed for consistent display.
                </p>
            </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptPage;