import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Dynamically imports the specific template module (not the lazy wrapper),
 * so renderToString always gets the real component — never the Suspense fallback spinner.
 */
const loadTemplate = async (templateNumber) => {
  const num = parseInt(templateNumber, 10);
  switch (num) {
    case 1:  return (await import('../components/templates/Template1')).default;
    case 2:  return (await import('../components/templates/Template2')).default;
    case 3:  return (await import('../components/templates/Template3')).default;
    case 4:  return (await import('../components/templates/Template4')).default;
    case 5:  return (await import('../components/templates/Template5')).default;
    case 6:  return (await import('../components/templates/Template6')).default;
    case 7:  return (await import('../components/templates/Template7')).default;
    case 8:  return (await import('../components/templates/Template8')).default;
    case 9:  return (await import('../components/templates/Template9')).default;
    case 10: return (await import('../components/templates/Template10')).default;
    default: return (await import('../components/templates/Template1')).default;
  }
};

/**
 * Core PDF generation using html2canvas + jsPDF.
 * Directly awaits the template chunk before renderToString so we never
 * capture the React.Suspense spinner fallback.
 */
const renderInvoiceToPDF = async (invoiceData, templateNumber) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  document.body.appendChild(container);

  try {
    // Await the real template component — no lazy/Suspense involved
    const [Template, React, ReactDOMServer] = await Promise.all([
      loadTemplate(templateNumber),
      import('react').then(m => m.default),
      import('react-dom/server').then(m => m.default),
    ]);

    const element = React.createElement(Template, { data: invoiceData });
    const html = ReactDOMServer.renderToString(element);

    container.innerHTML = html;
    container.style.height = '297mm';

    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      imageTimeout: 8000,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF('p', 'mm', 'a4', true);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    return pdf;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
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
