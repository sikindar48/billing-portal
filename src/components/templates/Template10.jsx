import React from 'react';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateSafely } from '../../utils/formatDate';
import { QRCodeSVG } from 'qrcode.react';

const Template10 = ({ data }) => {
  const { 
    billTo = {}, 
    shipTo = {}, 
    invoice = {}, 
    yourCompany = {}, 
    items = [], 
    taxPercentage = 0, 
    taxAmount = 0, 
    subTotal = 0, 
    grandTotal = 0, 
    notes = '', 
    selectedCurrency 
  } = data || {};

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;
  const primaryColor = "#4F46E5"; // Indigo
  const lightBg = "#F3F4F6"; // Light gray

  return (
    <BaseTemplate data={data}>
      <div className="bg-white min-h-[297mm] flex flex-col font-sans text-gray-800">
        
        {/* HEADER SECTION */}
        <div style={{ backgroundColor: primaryColor }} className="text-white px-12 py-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-5xl font-black mb-2">INVOICE</h1>
              <p className="text-lg opacity-90">Invoice #{invoice.number || "N/A"}</p>
            </div>
            {yourCompany.logoUrl && (
              <img 
                src={yourCompany.logoUrl} 
                alt="Logo" 
                className="h-20 w-auto object-contain brightness-0 invert" 
              />
            )}
          </div>
          
          {/* Company Info in Header */}
          <div className="border-t border-white/20 pt-6">
            <h2 className="text-2xl font-bold mb-1">{yourCompany.name || "Your Company"}</h2>
            {yourCompany.tagline && <p className="text-sm opacity-80 mb-3">{yourCompany.tagline}</p>}
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <p className="opacity-70">Address</p>
                <p className="font-medium">{yourCompany.address || "N/A"}</p>
              </div>
              <div>
                <p className="opacity-70">Phone</p>
                <p className="font-medium">{yourCompany.phone || "N/A"}</p>
              </div>
              {yourCompany.website && (
                <div>
                  <p className="opacity-70">Website</p>
                  <p className="font-medium">{yourCompany.website}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INFO GRID SECTION */}
        <div className="grid grid-cols-2 gap-0 border-b-2" style={{ borderColor: primaryColor }}>
          {/* Billed To */}
          <div className="p-8 border-r-2" style={{ borderColor: primaryColor }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }}>
              Billed To
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-bold text-gray-900 text-base">{billTo.name || "Client Name"}</p>
              <p className="text-gray-600">{billTo.address || "Client Address"}</p>
              <p className="text-gray-600">{billTo.phone || "Client Phone"}</p>
              {billTo.email && <p className="text-gray-600">{billTo.email}</p>}
            </div>
          </div>

          {/* Invoice Details */}
          <div style={{ backgroundColor: lightBg }} className="p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }}>
              Invoice Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">{formatDateSafely(invoice.date, "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-semibold" style={{ color: primaryColor }}>{formatDateSafely(invoice.paymentDate, "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-semibold text-gray-900">{selectedCurrency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE SECTION */}
        <div className="flex-grow p-8">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: lightBg, borderBottom: `2px solid ${primaryColor}` }}>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  Description
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  Qty
                </th>
                <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  Unit Price
                </th>
                <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td className="px-4 py-5">
                    <p className="font-semibold text-gray-900">{item.name || "Item"}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-5 text-center font-medium text-gray-900">
                    {item.quantity || 0}
                  </td>
                  <td className="px-4 py-5 text-right font-medium text-gray-900">
                    {formatCurrency(item.amount || 0, selectedCurrency)}
                  </td>
                  <td className="px-4 py-5 text-right font-bold text-gray-900">
                    {formatCurrency((item.quantity || 0) * (item.amount || 0), selectedCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION */}
        <div className="border-t-2 p-8" style={{ borderColor: primaryColor }}>
          <div className="grid grid-cols-3 gap-8">
            
            {/* Left: QR Code & Notes */}
            <div className="col-span-1">
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primaryColor }}>
                  Scan to Verify
                </h4>
                <div className="bg-white p-3 border-2 border-gray-200 rounded-lg w-fit">
                  <QRCodeSVG value={qrValue} size={80} level="L" />
                </div>
              </div>
              
              {notes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>
                    Notes
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{notes}</p>
                </div>
              )}
            </div>

            {/* Right: Totals */}
            <div className="col-span-2 flex justify-end">
              <div className="w-80">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(subTotal, selectedCurrency)}</span>
                  </div>
                  
                  {taxPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({taxPercentage}%):</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(taxAmount, selectedCurrency)}</span>
                    </div>
                  )}
                </div>

                {/* Total Due Box */}
                <div 
                  style={{ backgroundColor: primaryColor }} 
                  className="text-white p-6 rounded-lg"
                >
                  <p className="text-xs uppercase tracking-widest opacity-90 mb-2">Total Due</p>
                  <p className="text-4xl font-black">
                    {formatCurrency(grandTotal, selectedCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="text-center text-xs text-gray-500 py-4 border-t">
          <p>This is a computer-generated invoice and doesn't require a signature. Thank you for your business.</p>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template10;
