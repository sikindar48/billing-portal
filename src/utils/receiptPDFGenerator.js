import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// NOTE: The signature is updated to match the arguments passed from ReceiptPage.jsx
export const generateReceiptPDF = async (receiptElement, theme, data) => {
  try {
    // CRITICAL FIX: Increase scale (resolution) for better CSS/text rendering
    const canvas = await html2canvas(receiptElement, {
      scale: 4, 
      useCORS: true, // ESSENTIAL for loading external logo images (Supabase)
      logging: false,
      allowTaint: true, // Helps with cross-origin content rendering
      // Set scroll position to 0 to prevent cutting off content
      scrollY: -window.scrollY,
      scrollX: -window.scrollX
    });

    const imgData = canvas.toDataURL('image/png'); // Use PNG for best text clarity
    
    // --- FIX FOR A4 SIZE ---
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // Explicitly set to A4 format (210mm x 297mm)
    });

    // A4 dimensions in mm
    const a4Width = 210;
    const a4Height = 297;
    
    // Calculate the aspect ratio of the captured image
    const ratio = canvas.height / canvas.width;
    
    // Set image width to fit the PDF width (minus a small margin, e.g., 20mm total margin)
    const imgWidth = a4Width - 20; 
    const imgHeight = imgWidth * ratio; 
    
    // Center the content (10mm margin on each side)
    const x = 10;
    const y = 10;
    
    // Add image, scaling it to fit the A4 page width while preserving aspect ratio
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight); 
    // ----------------------

    // Generate a cleaner filename using invoice number and current date/time
    const fileName = `Receipt_${data?.invoice?.number || new Date().getTime()}.pdf`;

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating Receipt PDF:', error);
    // Throw an error so the calling component can react if needed
    throw new Error('Failed to generate PDF. Check browser console for details.');
  }
};