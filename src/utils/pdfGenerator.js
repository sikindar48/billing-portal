import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Core PDF Generation logic using html2canvas and jsPDF
 */
const renderInvoiceToPDF = async (invoiceData, templateNumber) => {
  const invoice = document.createElement('div');
  invoice.style.position = 'fixed';
  invoice.style.left = '-9999px';
  invoice.style.top = '0';
  document.body.appendChild(invoice);

  try {
    const InvoiceTemplate = (await import('../components/InvoiceTemplate')).default;
    const ReactDOMServer = (await import('react-dom/server')).default;
    const React = (await import('react')).default;
    
    const invoiceElement = React.createElement(InvoiceTemplate, { data: invoiceData, templateNumber });
    const invoiceHTML = ReactDOMServer.renderToString(invoiceElement);
    
    invoice.innerHTML = invoiceHTML;
    invoice.style.width = '210mm';
    invoice.style.height = '297mm';
    
    const canvas = await html2canvas(invoice, {
      scale: 1.5, // Reduced from 2 for 2x faster processing
      useCORS: true,
      logging: false,
      imageTimeout: 5000, // 5s timeout
    });
    
    // Use JPEG for much smaller payload and faster encoding
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('p', 'mm', 'a4', true); // compress: true
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    
    return pdf;
  } finally {
    if (document.body.contains(invoice)) {
      document.body.removeChild(invoice);
    }
  }
};

export const generatePDF = async (invoiceData, templateNumber) => {
  try {
    const pdf = await renderInvoiceToPDF(invoiceData, templateNumber);
    const number = invoiceData.invoice?.number || 'invoice';
    pdf.save(`Invoice_${number}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

export const generatePDFBase64 = async (invoiceData, templateNumber) => {
  try {
    const pdf = await renderInvoiceToPDF(invoiceData, templateNumber);
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
    
    // Efficiently convert Uint8Array to base64 string
    let binary = '';
    const len = pdfUint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(pdfUint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('PDF Base64 Generation Error:', error);
    throw error;
  }
};
