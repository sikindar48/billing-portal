import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Layout, CheckCircle, Lock, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { generatePDF } from '../utils/pdfGenerator';
import { templates } from '../utils/templateRegistry';
import Navigation from '../components/Navigation';

const TemplatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Restriction State
  const [downloadCount, setDownloadCount] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false); // Combines Admin + Pro checks
  const DOWNLOAD_LIMIT = 5;

  useEffect(() => {
    // 1. Load Form Data
    if (location.state && location.state.formData) {
      setFormData(location.state.formData);
      setCurrentTemplate(location.state.selectedTemplate || 1);
    } else {
      const savedFormData = localStorage.getItem("formData");
      if (savedFormData) {
        setFormData(JSON.parse(savedFormData));
      }
    }

    // 2. Check Subscription & Download Count
    const checkAccess = async () => {
        const savedCount = parseInt(localStorage.getItem('pdf_download_count') || '0');
        setDownloadCount(savedCount);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // A. Admin Check
        const adminEmails = ['nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com'];
        if (adminEmails.includes(user.email)) {
             setIsUnlimited(true);
             return;
        }
        
        // B. Role Check
        const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        if (role) {
            setIsUnlimited(true);
            return;
        }

        // C. Subscription Plan Check
        const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(slug)')
            .eq('user_id', user.id)
            .maybeSingle();
        
        // If plan is NOT trial, allow unlimited
        if (sub?.subscription_plans?.slug !== 'trial') {
            setIsUnlimited(true);
        }
    };
    checkAccess();
  }, [location.state]);

  const handleTemplateChange = (templateNumber) => {
    setCurrentTemplate(templateNumber);
  };

  const handleDownloadPDF = async () => {
    if (!formData) return;

    // Check Limit logic
    if (!isUnlimited && downloadCount >= DOWNLOAD_LIMIT) {
        toast.error(
            <div className="flex flex-col">
                <span className="font-bold">Download Limit Reached</span>
                <span className="text-xs">Free trial allows 5 downloads. Please upgrade.</span>
            </div>,
            { duration: 3000 }
        );
        return;
    }

    setIsDownloading(true);
    try {
      await generatePDF(formData, currentTemplate);
      
      // Increment Count if NOT unlimited
      if (!isUnlimited) {
          const newCount = downloadCount + 1;
          setDownloadCount(newCount);
          localStorage.setItem('pdf_download_count', newCount.toString());
      }
      
      toast.success("PDF Downloaded Successfully!", { duration: 1500 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF.", { duration: 2000 });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!formData) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation />
      
      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl h-[calc(100vh-80px)]">
        <div className="flex flex-col lg:flex-row h-full gap-6">
            
            {/* SIDEBAR: Controls & Templates */}
            <div className="w-full lg:w-1/4 flex flex-col gap-4 h-full">
                
                {/* Actions Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <Button variant="ghost" onClick={handleBack} className="mb-4 pl-0 hover:bg-transparent hover:text-indigo-600">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
                    </Button>
                    
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Finalize & Export</h1>
                    <p className="text-sm text-gray-500 mb-6">Select a template and download.</p>

                    <Button 
                        onClick={handleDownloadPDF} 
                        disabled={isDownloading || (!isUnlimited && downloadCount >= DOWNLOAD_LIMIT)}
                        className={`w-full h-12 text-base font-semibold shadow-md transition-all ${
                            (!isUnlimited && downloadCount >= DOWNLOAD_LIMIT) 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200'
                        }`}
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-5 w-5" /> Download PDF
                            </>
                        )}
                    </Button>

                    {!isUnlimited && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                <span>Downloads Remaining</span>
                                <span className={downloadCount >= DOWNLOAD_LIMIT ? "text-red-600" : "text-indigo-600"}>
                                    {Math.max(0, DOWNLOAD_LIMIT - downloadCount)} left
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div 
                                    className={`h-1.5 rounded-full transition-all ${downloadCount >= DOWNLOAD_LIMIT ? 'bg-red-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${Math.min((downloadCount / DOWNLOAD_LIMIT) * 100, 100)}%` }}
                                />
                            </div>
                            {downloadCount >= DOWNLOAD_LIMIT && (
                                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Trial limit reached.
                                </p>
                            )}
                        </div>
                    )}
                    
                    {isUnlimited && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                             <p className="text-xs font-medium text-green-700 flex items-center justify-center gap-1">
                                 <CheckCircle className="w-3 h-3" /> Unlimited Downloads Active
                             </p>
                        </div>
                    )}
                </div>

                {/* Template Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Layout className="w-4 h-4 text-indigo-500" /> Available Templates
                        </h3>
                    </div>
                    <div className="p-2 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
                        {templates.map((template, index) => {
                            const isSelected = currentTemplate === index + 1;
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleTemplateChange(index + 1)}
                                    className={`p-3 rounded-lg cursor-pointer border-2 transition-all flex items-center gap-3 ${
                                        isSelected 
                                        ? "border-indigo-500 bg-indigo-50/30" 
                                        : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold ${
                                        isSelected ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>
                                            {template.name}
                                        </p>
                                        <p className="text-xs text-gray-500">Professional Layout</p>
                                    </div>
                                    {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="w-full lg:w-3/4 bg-gray-200/50 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
                    <h2 className="font-semibold text-gray-700">Live Preview</h2>
                    <span className="text-xs text-gray-400">A4 Format • {currentTemplate === 1 ? 'Classic' : 'Modern'} Style</span>
                </div>
                <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-100">
                    <div className="shadow-2xl bg-white transition-all duration-300 origin-top transform scale-[0.8] sm:scale-100">
                         <InvoiceTemplate data={formData} templateNumber={currentTemplate} />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TemplatePage;