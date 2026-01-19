import React from 'react';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template1 = ({ data }) => {
  const { 
    billTo, 
    shipTo, 
    invoice, 
    yourCompany, // Now includes logoUrl and website
    items, 
    taxPercentage, 
    taxAmount, 
    subTotal, 
    grandTotal, 
    notes, 
    selectedCurrency 
  } = data;

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;

  return (
    <BaseTemplate data={data}>
      <div className="bg-white p-8 max-w-4xl mx-auto">
        
        {/* TOP SECTION: LOGO, COMPANY INFO, INVOICE TITLE */}
        <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col items-start">
                {/* --- BRANDING INTEGRATION START: Logo (MODIFIED) --- */}
                {yourCompany.logoUrl && (
                    <div className="mb-4">
                        <img 
                            src={yourCompany.logoUrl} 
                            alt={`${yourCompany.name} Logo`} 
                            style={{ 
                                maxWidth: '180px', 
                                maxHeight: '90px', 
                                objectFit: 'contain' 
                            }} 
                            // REMOVED: className="p-1 border border-gray-200"
                            className=""
                        />
                    </div>
                )}
                {/* --- BRANDING INTEGRATION END --- */}

                <h1 className="text-2xl font-bold">{yourCompany.name}</h1>
                <p>{yourCompany.address}</p>
                <p>{yourCompany.phone}</p>
                {/* --- WEBSITE INTEGRATION --- */}
                {yourCompany.website && <p className="text-sm text-blue-600">{yourCompany.website}</p>}
                {/* --------------------------- */}
            </div>
            
            <div className="text-right">
                <h2 className="text-4xl font-extrabold text-gray-800 mb-4">INVOICE</h2>
                <p className="text-sm">Invoice Number: <span className="font-semibold">{invoice.number}</span></p>
                <p className="text-sm">Invoice Date: {invoice.date}</p>
                <p className="text-sm">Due Date: <span className="font-semibold text-red-600">{invoice.paymentDate}</span></p>
            </div>
        </div>

        <div className="border-b-2 border-gray-300 mb-8"></div>

        {/* ADDRESSES */}
        <div className="flex justify-between mb-8">
          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-1">Bill To:</h3>
            <p className="font-medium">{billTo.name}</p>
            <p className="text-sm">{billTo.address}</p>
            <p className="text-sm">{billTo.phone}</p>
            {billTo.email && <p className="text-sm">{billTo.email}</p>}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-1">Ship To:</h3>
            <p className="font-medium">{shipTo.name}</p>
            <p className="text-sm">{shipTo.address}</p>
            <p className="text-sm">{shipTo.phone}</p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-t-2 border-gray-800 bg-gray-100/70">
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-center">Quantity</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3">
                  <span className="font-medium">{item.name}</span>
                  {item.description && (
                      <div className="text-xs text-gray-500 italic">
                        {item.description}
                      </div>
                  )}
                </td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">
                  {formatCurrency(item.amount, selectedCurrency)}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(item.total, selectedCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS AND NOTES */}
        <div className="flex justify-between mt-12">
            <div className="w-2/3 pr-8">
                <h3 className="font-semibold mb-2 text-gray-700">Notes:</h3>
                <p className="text-sm text-gray-600 border p-3 rounded bg-gray-50/50">{notes || "N/A"}</p>
                
                {/* QR Code Section */}
                <div className="mt-8">
                    <h3 className="font-semibold text-gray-700 mb-2">Scan to Verify:</h3>
                    <QRCodeSVG 
                      value={qrValue}
                      size={100}
                      level="L"
                      className="border p-1"
                    />
                </div>
            </div>

            <div className="w-1/3">
                <div className="border-t pt-2">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subTotal, selectedCurrency)}</span>
                    </div>
                    {taxPercentage > 0 && (
                      <div className="flex justify-between mb-2">
                        <span>Tax ({taxPercentage}%):</span>
                        <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2 border-gray-400">
                      <span>GRAND TOTAL:</span>
                      <span>{formatCurrency(grandTotal, selectedCurrency)}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template1;