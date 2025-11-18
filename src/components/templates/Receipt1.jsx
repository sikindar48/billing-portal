import React from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import BaseTemplate2 from './BaseTemplate2';
import { calculateSubTotal, calculateTaxAmount, calculateGrandTotal } from '../../utils/invoiceCalculations';
import { formatCurrency } from '../../utils/formatCurrency';

const Receipt1 = ({ data, isPrint = false }) => {
  const { billTo = {}, invoice = {}, yourCompany = {}, cashier = '', items = [], taxPercentage = 0, notes = '', footer = '', selectedCurrency } = data || {};

  const subTotal = calculateSubTotal(items);
  const taxAmount = calculateTaxAmount(subTotal, taxPercentage);
  const total = calculateGrandTotal(subTotal, taxAmount);
  
  const dateTime = invoice.date 
    ? `${format(new Date(invoice.date), "MM/dd/yyyy")} ${format(new Date(), "HH:mm")}`
    : format(new Date(), "MM/dd/yyyy HH:mm");
    
  const qrValue = `Invoice: ${invoice.number || 'N/A'}, Total: ${formatCurrency(total, selectedCurrency)}, Date: ${dateTime}`;

  return (
    <BaseTemplate2
      width="80mm"
      height="auto"
      className="p-1" // Slightly reduced padding for 80mm width
      data={data}
      isPrint={isPrint}
    >
      <div
        className="bg-white flex flex-col min-h-full"
        style={{
          fontSize: isPrint ? "8px" : "14px",
          fontFamily: "'Courier New', Courier, monospace",
          whiteSpace: "pre-wrap",
          lineHeight: "1.2",
        }}
      >
        <div className="flex-grow">
          
          {/* HEADER & BRANDING */}
          <div className="text-center pb-2 border-b border-dashed border-gray-900 mb-2">
            <div className="font-bold mb-1">--- SALE RECEIPT ---</div>
            
            {yourCompany.logoUrl && (
              <div className="mb-2">
                <img 
                  src={yourCompany.logoUrl} 
                  alt={`${yourCompany.name} Logo`} 
                  className="mx-auto" 
                  style={{ 
                    maxWidth: isPrint ? '50px' : '80px', 
                    maxHeight: isPrint ? '25px' : '40px', 
                    objectFit: 'contain'
                  }} 
                />
              </div>
            )}
            
            <div className="font-bold uppercase">{yourCompany.name || "YOUR STORE"}</div>
            <div>{yourCompany.address || "123 Main St"}</div>
            {yourCompany.phone && <div>Ph: {yourCompany.phone}</div>}
            {yourCompany.website && <div className="text-xs">{yourCompany.website}</div>}
          </div>
            
          {/* TRANSACTION DETAILS */}
          <div className="mb-2">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span>{invoice.number || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>{dateTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{billTo || "Walk-in"}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{cashier || "N/A"}</span>
            </div>
          </div>
          
          {/* ITEMS LIST */}
          <div className="border-t border-b border-dashed border-gray-900 py-2 mb-2">
            <div className="flex font-bold mb-1">
              <span className="w-1/2 text-left">ITEM (QTY)</span>
              <span className="w-1/4 text-right">RATE</span>
              <span className="w-1/4 text-right">TOTAL</span>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="mb-1 text-xs">
                {/* Item Name & Qty */}
                <div className="flex justify-between">
                    <span className="w-1/2 text-left">
                        {item.name || "N/A"} ({item.quantity || 0})
                    </span>
                    <span className="w-1/4 text-right">
                         {formatCurrency(item.amount || 0, selectedCurrency)}
                    </span>
                    <span className="w-1/4 text-right">
                        {formatCurrency((item.quantity || 0) * (item.amount || 0), selectedCurrency)}
                    </span>
                </div>
                {/* Item Description (If available) */}
                {item.description && (
                    <div className="italic text-gray-500 text-[9px] w-full">{item.description}</div>
                )}
              </div>
            ))}
          </div>
          
          {/* TOTALS SUMMARY */}
          <div className="mb-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subTotal, selectedCurrency)}</span>
            </div>
            {taxPercentage > 0 && (
              <div className="flex justify-between">
                <span>Tax ({taxPercentage}%):</span>
                <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
              </div>
            )}
            
            <div className="border-t border-gray-900 mt-1 pt-1 flex justify-between font-bold text-lg">
              <span>TOTAL DUE:</span>
              <span>{formatCurrency(total, selectedCurrency)}</span>
            </div>
            {/* Payment Method/Change Due space can be added here if needed */}
          </div>
          
          {/* NOTES */}
          {notes && (
            <div className="mt-4 text-center text-xs border-t border-dashed pt-2">
              <div className="font-semibold">NOTES:</div>
              <div className="italic">{notes}</div>
            </div>
          )}
          
          {/* QR CODE */}
          <div className="flex justify-center mt-4 border-t border-dashed pt-2">
            <QRCodeSVG 
              value={qrValue}
              size={80}
              level="M"
            />
          </div>
        </div>
        
        {/* FOOTER MESSAGE */}
        <div className="text-center mt-4 pt-2 border-t border-dashed">
          {footer || "Thank you for your business!"}
        </div>
        
      </div>
    </BaseTemplate2>
  );
};

export default Receipt1;