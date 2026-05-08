import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../utils/formatCurrency';

const QRSection = ({ data, showLabel = true }) => {
  const { invoice, yourCompany, grandTotal, selectedCurrency } = data;
  
  const upiId = yourCompany?.upiId;
  
  const qrValue = useMemo(() => {
    if (upiId) {
      // UPI Intent URL: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tn=INVOICE_NUMBER&cu=CURRENCY
      const name = encodeURIComponent(yourCompany.name || 'Business');
      const note = encodeURIComponent(`Invoice ${invoice.number}`);
      const currency = selectedCurrency || 'INR';
      return `upi://pay?pa=${upiId}&pn=${name}&am=${grandTotal}&tn=${note}&cu=${currency}`;
    }
    
    // Fallback to Verification URL (Interactive)
    const productionUrl = 'https://www.invoiceport.live';
    return `${productionUrl}/verify-invoice?number=${invoice.number}`;
  }, [upiId, yourCompany.name, invoice.number, grandTotal, selectedCurrency]);

  return (
    <div className="flex flex-col items-center">
      {showLabel && (
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {upiId ? 'Scan to Pay (UPI)' : 'Scan to Verify'}
        </h3>
      )}
      <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
        <QRCodeSVG 
          value={qrValue}
          size={90}
          level="M"
        />
      </div>
      {upiId && (
        <p className="text-[10px] text-gray-400 mt-1 font-medium">{upiId}</p>
      )}
    </div>
  );
};

export default QRSection;
