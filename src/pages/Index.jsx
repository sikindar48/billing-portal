import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatCurrency'; 
import FloatingLabelInput from '../components/FloatingLabelInput';
import BillToSection from '../components/BillToSection';
import ShipToSection from '../components/ShipToSection';
import ItemDetails from "../components/ItemDetails";
import { templates } from "../utils/templateRegistry";
import { FiEdit, FiFileText, FiTrash2, FiLayers } from "react-icons/fi"; 
import { RefreshCw, Save, Loader2, DollarSign } from "lucide-react"; 
import { set, sub } from "date-fns";
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

  for (let i = 0; i < alphabetCount; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  for (let i = alphabetCount; i < length; i++) {
    result += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return result;
};

const noteOptions = [
  "Thank you for choosing us today! We hope your shopping experience was pleasant and seamless. Your satisfaction matters to us, and we look forward to serving you again soon. Keep this receipt for any returns or exchanges.",
  "Your purchase supports our community! We believe in giving back and working towards a better future. Thank you for being a part of our journey. We appreciate your trust and hope to see you again soon.",
  "We value your feedback! Help us improve by sharing your thoughts on the text message survey link. Your opinions help us serve you better and improve your shopping experience. Thank you for shopping with us!",
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

const Index = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false); 
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false); 
  
  const [brandingSettings, setBrandingSettings] = useState({
    logoUrl: '',
    brandingCompanyName: '',
    brandingWebsite: '',
  });

  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [billTo, setBillTo] = useState({ name: "", address: "", phone: "" });
  const [shipTo, setShipTo] = useState({ name: "", address: "", phone: "" });
  const [invoice, setInvoice] = useState({
    date: "",
    paymentDate: "",
    number: "",
  });
  const [yourCompany, setYourCompany] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
  });
  const [items, setItems] = useState([]);
  const [taxPercentage, settaxPercentage] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [notes, setNotes] = useState("");

  const refreshNotes = () => {
    const randomIndex = Math.floor(Math.random() * noteOptions.length);
    setNotes(noteOptions[randomIndex]);
  };

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
        }
    };
    fetchBranding();
  }, []);

  useEffect(() => {
    const savedFormData = localStorage.getItem("formData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setBillTo(parsedData.billTo || { name: "", address: "", phone: "" });
      setShipTo(parsedData.shipTo || { name: "", address: "", phone: "" });
      setInvoice(
        parsedData.invoice || { date: "", paymentDate: "", number: "" }
      );
      
      const initialYourCompany = parsedData.yourCompany || { name: "", address: "", phone: "", website: "" };
      
      setYourCompany({
        ...initialYourCompany,
        name: initialYourCompany.name || brandingSettings.brandingCompanyName,
        website: initialYourCompany.website || brandingSettings.brandingWebsite,
      });

      setItems(parsedData.items || []);
      settaxPercentage(parsedData.taxPercentage || 0);
      setNotes(parsedData.notes || "");
      setSelectedCurrency(parsedData.selectedCurrency || "INR"); 
    } else {
      setInvoice((prev) => ({
        ...prev,
        number: generateRandomInvoiceNumber(),
      }));
       setYourCompany(prev => ({
        ...prev,
        name: brandingSettings.brandingCompanyName,
        website: brandingSettings.brandingWebsite,
      }));
    }
  }, [
    brandingSettings.brandingCompanyName, 
    brandingSettings.brandingWebsite
  ]); 


  useEffect(() => {
    const formData = {
      billTo,
      shipTo,
      invoice,
      yourCompany,
      items,
      taxPercentage,
      taxAmount,
      subTotal,
      grandTotal,
      notes,
      selectedCurrency,
    };
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [
    billTo,
    shipTo,
    invoice,
    yourCompany,
    items,
    taxPercentage,
    notes,
    taxAmount,
    subTotal,
    grandTotal,
    selectedCurrency,
  ]);

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
    updateTotals();
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

  const calculateSubTotal = () => {
    const calculatedSubTotal = items.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
    setSubTotal(calculatedSubTotal); 
    return calculatedSubTotal;
  };

  const calculateTaxAmount = (subTotalValue) => { 
    const tax = (subTotalValue * taxPercentage) / 100;
    setTaxAmount(tax); 
    return tax;
  };

  const calculateGrandTotal = (subTotalValue, taxAmountValue) => { 
    const total = parseFloat(subTotalValue) + parseFloat(taxAmountValue);
    setGrandTotal(total); 
    return total;
  };

  const updateTotals = () => {
    const currentSubTotal = calculateSubTotal();
    const currentTaxAmount = calculateTaxAmount(currentSubTotal);
    calculateGrandTotal(currentSubTotal, currentTaxAmount);
  };

  const handleTaxPercentageChange = (e) => {
    const taxRate = parseFloat(e.target.value) || 0;
    settaxPercentage(taxRate);
  };

  useEffect(() => {
    updateTotals();
  }, [items, taxPercentage]);

  // *** Invoice Save Logic ***
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save invoices.');
        setIsSaving(false);
        return;
      }

      const currentSubTotal = calculateSubTotal();
      const currentTaxAmount = calculateTaxAmount(currentSubTotal);
      const currentGrandTotal = calculateGrandTotal(currentSubTotal, currentTaxAmount);

      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        invoice_number: invoice.number,
        bill_to: billTo,
        ship_to: shipTo,
        invoice_details: invoice,
        from_details: { ...yourCompany, logo_url: brandingSettings.logoUrl },
        items: items,
        tax: taxPercentage,
        subtotal: currentSubTotal,
        grand_total: currentGrandTotal,
        notes: notes,
        template_name: templates[0]?.name || 'Template 1', 
      });

      if (error) throw error;
      toast.success('Invoice saved successfully!');

    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };
  // *****************************

  const handleTemplateSelect = (templateNumber) => {
    setIsTemplateModalOpen(false); // Close modal
    const companyDataWithBranding = {
        ...yourCompany,
        logoUrl: brandingSettings.logoUrl, 
    };

    const formData = {
      billTo,
      shipTo,
      invoice,
      yourCompany: companyDataWithBranding, 
      items,
      taxPercentage,
      taxAmount,
      subTotal,
      grandTotal,
      notes,
      selectedCurrency,
    };
    
    navigate("/template", {
      state: { formData, selectedTemplate: templateNumber },
    });
  };

  const fillDummyData = () => {
    setBillTo({
      name: "John Doe",
      address: "123 Main St, Anytown, USA",
      phone: "(555) 123-4567",
    });
    setShipTo({
      name: "Jane Smith",
      address: "456 Elm St, Othertown, USA",
      phone: "(555) 987-6543",
    });
    setInvoice({
      date: new Date().toISOString().split("T")[0],
      paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      number: generateRandomInvoiceNumber(),
    });
    setYourCompany(prev => ({
      ...prev,
      name: "Your Company",
      address: "789 Oak St, Businessville, USA",
      phone: "(555) 555-5555",
      website: "https://example.com"
    }));
    setItems([
      { name: "Product A", description: "High-quality item", quantity: 2, amount: 50, total: 100, },
      { name: "Service B", description: "Professional service", quantity: 1, amount: 200, total: 200, },
      { name: "Product C", description: "Another great product", quantity: 3, amount: 30, total: 90, },
      { name: "Service D", description: "Another professional service", quantity: 2, amount: 150, total: 300, },
      { name: "Product E", description: "Yet another product", quantity: 1, amount: 75, total: 75, },
      { name: "Service F", description: "Yet another service", quantity: 4, amount: 100, total: 400, },
    ]);
    settaxPercentage(10);
    calculateSubTotal();
    setNotes("Thank you for your business!");
  };

  const clearForm = () => {
    setBillTo({ name: "", address: "", phone: "" });
    setShipTo({ name: "", address: "", phone: "" });
    setInvoice({
      date: "",
      paymentDate: "",
      number: generateRandomInvoiceNumber(),
    });
    // Resetting yourCompany while preserving branding defaults
    setYourCompany(prev => ({ 
        name: brandingSettings.brandingCompanyName || "", 
        address: "", 
        phone: "", 
        website: brandingSettings.brandingWebsite || "" 
    }));
    setItems([{ name: "", description: "", quantity: 0, amount: 0, total: 0 }]);
    settaxPercentage(0);
    setNotes("");
    localStorage.removeItem("formData");
  };

  return (
    <>
      <Navigation className="bg-blue-600 shadow-lg" /> 
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900">Professional Invoice Creator</h1>
          
          {/* --- ACTION BAR --- */}
          <div className="mb-8 p-4 bg-blue-600 shadow-2xl rounded-xl"> 
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Left Group: Utility Actions (Clear, Demo) */}
              <div className="flex gap-3">
                <Button
                  onClick={clearForm}
                  className="bg-red-500 hover:bg-red-600 font-semibold shadow-lg px-4 text-white" 
                  aria-label="Clear Form"
                  title="Clear Form"
                >
                  <FiTrash2 size={16} className="mr-2" />
                  Clear Form
                </Button>
                <Button
                  onClick={fillDummyData}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold shadow-lg px-4" 
                  aria-label="Fill with Dummy Data"
                  title="Fill with Dummy Data"
                >
                  <FiEdit size={16} className="mr-2" />
                  Demo Data
                </Button>
              </div>
              
              {/* Right Group: Save, Navigate, and Currency */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                
                {/* Currency Selector */}
                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg text-gray-800">
                    <DollarSign size={16} className="text-green-600" />
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger className="w-[100px] bg-white text-gray-800 border-gray-300">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {/* TEMPLATE BUTTON */}
                <Button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 font-semibold shadow-lg px-4 text-white"
                    aria-label="View and Select Template"
                >
                    <FiLayers size={16} className="mr-2" />
                    View Templates
                </Button>
                
                {/* SAVE BUTTON */}
                <Button
                  onClick={handleSaveToDatabase}
                  disabled={isSaving}
                  className="bg-green-500 hover:bg-green-600 font-semibold shadow-lg px-4 text-white" 
                  aria-label="Save to Database"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save Invoice
                </Button>

                {/* RECEIPTS BUTTON */}
                <Button
                  onClick={() =>
                    navigate("/receipt", {
                      state: {
                        formData: {
                          billTo,
                          shipTo,
                          invoice,
                          yourCompany: { ...yourCompany, logoUrl: brandingSettings.logoUrl },
                          items,
                          taxPercentage,
                          notes,
                          selectedCurrency,
                        },
                      },
                    })
                  }
                  className="bg-purple-600 hover:bg-purple-700 font-semibold shadow-lg px-4 text-white"
                  aria-label="Switch to Receipt Generator"
                >
                  <FiFileText size={16} className="mr-2" />
                  Receipts
                </Button>
              </div>
            </div>
          </div>
          {/* --- END ACTION BAR --- */}


          {/* --- MAIN FORM (Full Width) --- */}
          <div className="w-full bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
              <form>
                {/* BILL TO & SHIP TO SECTIONS */}
                <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Client Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <BillToSection
                      billTo={billTo}
                      handleInputChange={handleInputChange(setBillTo)}
                    />
                    <ShipToSection
                      shipTo={shipTo}
                      handleInputChange={handleInputChange(setShipTo)}
                      billTo={billTo}
                    />
                </div>

                {/* INVOICE & COMPANY INFORMATION */}
                <div className="mt-6 border-t pt-6">
                  <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Invoice & Sender Info</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* INVOICE DATES & ID */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-700">Dates & ID</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingLabelInput
                          id="invoiceNumber"
                          label="Invoice Number"
                          value={invoice.number}
                          onChange={handleInputChange(setInvoice)}
                          name="number"
                        />
                        <FloatingLabelInput
                          id="invoiceDate"
                          label="Invoice Date"
                          type="date"
                          value={invoice.date}
                          onChange={handleInputChange(setInvoice)}
                          name="date"
                        />
                        <FloatingLabelInput
                          id="paymentDate"
                          label="Payment Due Date"
                          type="date"
                          value={invoice.paymentDate}
                          onChange={handleInputChange(setInvoice)}
                          name="paymentDate"
                        />
                        {/* Placeholder for alignment */}
                        <div></div> 
                      </div>
                    </div>

                    {/* YOUR COMPANY INFORMATION */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-700">Your Company (Sender)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <FloatingLabelInput
                          id="yourCompanyAddress"
                          label="Address"
                          value={yourCompany.address}
                          onChange={handleInputChange(setYourCompany)}
                          name="address"
                        />
                        <FloatingLabelInput
                          id="yourCompanyWebsite"
                          label="Website"
                          value={yourCompany.website}
                          onChange={handleInputChange(setYourCompany)}
                          name="website"
                          type="url"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEM DETAILS (SCROLLABLE CONTAINER) */}
                <div className="mt-6 border-t pt-6">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Line Items</h2>
                    
                    {/* --- CRITICAL FIX: INTERNAL SCROLLING CONTAINER --- */}
                    <div className="max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 #e5e7eb' }}> 
                        <ItemDetails
                          items={items}
                          handleItemChange={handleItemChange}
                          removeItem={removeItem}
                          currencyCode={selectedCurrency}
                        />
                    </div>
                    {/* Add Item Button remains outside the scrollable area */}
                    <div className="mt-4"> 
                        <Button 
                            onClick={addItem}
                            variant="outline"
                            className="w-full border-dashed border-blue-400 text-blue-600 hover:bg-blue-50/50"
                        >
                            + Add Item
                        </Button>
                    </div>
                    {/* --- END CRITICAL FIX --- */}
                </div>


                {/* TOTALS AND NOTES */}
                <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* NOTES SECTION */}
                    <div>
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-medium text-gray-700">Notes / Terms</h3>
                        <button
                          type="button"
                          onClick={refreshNotes}
                          className="ml-2 p-1 rounded-full text-gray-600 hover:bg-gray-200 transition"
                          title="Refresh Notes"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
                        rows="6"
                        placeholder="Enter payment terms, guarantees, or additional remarks."
                      ></textarea>
                    </div>
                    
                    {/* TOTALS SUMMARY (Inline) */}
                    <div className="md:justify-self-end w-full md:w-auto md:min-w-[350px] p-6 border-4 border-blue-500 rounded-xl shadow-lg bg-blue-50/20">
                      <h3 className="text-2xl font-bold mb-4 text-blue-700">Invoice Total</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1 border-gray-200">
                          <span className="text-gray-600">Sub Total:</span>
                          <span className="font-medium text-gray-800">{formatCurrency(subTotal, selectedCurrency)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-1 border-gray-200">
                          <span className="text-gray-600">Tax Rate (%):</span>
                          <input
                            type="number"
                            value={taxPercentage}
                            onChange={(e) => handleTaxPercentageChange(e)}
                            className="w-20 p-1 border border-gray-300 rounded-lg text-right focus:border-blue-500"
                            min="0"
                            max="28"
                            step="1"
                          />
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-lg font-semibold">Tax Amount:</span>
                          <span className="text-lg font-semibold text-red-600">{formatCurrency(taxAmount, selectedCurrency)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between font-extrabold text-3xl border-t-2 pt-4 mt-4 border-blue-600">
                        <span>GRAND TOTAL:</span>
                        <span className="text-green-700">{formatCurrency(grandTotal, selectedCurrency)}</span>
                      </div>
                    </div>
                </div>
              </form>
            </div>
            {/* END MAIN FORM */}
          </div>
        </div>
   
      
      {/* TEMPLATE SELECTION MODAL */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-4xl p-6">
            <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-gray-900">Select Invoice Template</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[70vh] overflow-y-auto mt-4">
                {templates.map((template, index) => (
                    <div
                        key={index}
                        className="template-card bg-gray-100 p-3 rounded-lg cursor-pointer hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.05] border-2 border-transparent hover:border-blue-500/50"
                        onClick={() => handleTemplateSelect(index + 1)}
                    >
                        <img
                            src={`/assets/template${index + 1}-preview.png`}
                            alt={template.name}
                            className="w-full h-auto aspect-video object-cover rounded mb-2 border border-gray-300"
                        />
                        <p className="text-center font-medium text-sm text-gray-700">{template.name}</p>
                    </div>
                ))}
            </div>
        </DialogContent>
      </Dialog> 
    </>
  );
};

export default Index;