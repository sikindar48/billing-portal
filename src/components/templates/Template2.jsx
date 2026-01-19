import React from 'react';
import { format } from 'date-fns';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react';

const Template2 = ({ data = {} }) => {
  const { billTo = {}, shipTo = {}, invoice = {}, yourCompany = {}, items = [], taxPercentage = 0, taxAmount = 0, subTotal = 0, grandTotal = 0, notes = '', selectedCurrency } = data;

  // --- FRONTLINES MEDIA COLOR PALETTE ---
  const ACCENT_PRIMARY = '#FF9F00'; // Vibrant Orange (Main Highlight)
  const ACCENT_SECONDARY = '#FBBC05'; // Lighter Orange (Subtle background/Table header)
  const DARK_TEXT = '#313131';   // Dark Gray Text
  const LIGHT_BACKGROUND = '#FFBF001A'; // Very light transparent background using secondary accent

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;

  return (
    <BaseTemplate data={data}>
      <div 
        className="bg-white max-w-4xl mx-auto flex flex-col h-full overflow-hidden"
        style={{ color: DARK_TEXT }} // Apply dark text color globally
      >
        
        {/* HEADER BLOCK - Logo, Company Info, and Invoice Title */}
        <div 
          className="text-white p-8 mb-8 flex justify-between items-end"
          style={{ backgroundColor: ACCENT_PRIMARY }} // Use Primary Orange for the main header
        >
            
            {/* Left Side: Logo and Company Details */}
            <div className="flex flex-col items-start">
              {yourCompany.logoUrl && (
                  <div className="mb-2">
                      <img 
                          src={yourCompany.logoUrl} 
                          alt={`${yourCompany.name} Logo`} 
                          style={{ 
                              maxWidth: '180px', 
                              maxHeight: '80px', 
                              objectFit: 'contain' 
                          }} 
                      />
                  </div>
              )}
              <h2 className="text-xl font-bold mt-2">
                {yourCompany.name || "Company Name"}
              </h2>
              <p className="text-sm">{yourCompany.address || "Company Address"}</p>
              <p className="text-sm">{yourCompany.phone || "Company Phone"}</p>
              {yourCompany.website && <p className="text-xs" style={{ color: DARK_TEXT }}>{yourCompany.website}</p>}
            </div>

            {/* Right Side: INVOICE Label and Dates */}
            <div className="text-right">
              <h1 className="text-5xl font-extrabold mb-3">INVOICE</h1>
              <p className="text-sm">
                <span className="font-semibold">Invoice #:</span>
                <span>{invoice.number || "N/A"}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date:</span>
                <span>
                  {invoice.date ? format(new Date(invoice.date), "MMM dd, yyyy") : "N/A"}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Due:</span>
                <span>
                  {invoice.paymentDate ? format(new Date(invoice.paymentDate), "MMM dd, yyyy") : "N/A"}
                </span>
              </p>
            </div>
        </div>

        {/* ADDRESS BLOCK */}
        <div className="px-8 grid grid-cols-2 gap-8 mb-8">
            <div 
              className="p-4 rounded-lg border-l-4"
              style={{ backgroundColor: LIGHT_BACKGROUND, borderColor: ACCENT_PRIMARY }} // Light accent background with primary border
            >
                <h3 className="text-lg font-semibold mb-2" style={{ color: ACCENT_PRIMARY }}>Billed To</h3>
                <p className="font-bold">{billTo.name || "Client Name"}</p>
                <p>{billTo.address || "Client Address"}</p>
                <p>{billTo.phone || "Client Phone"}</p>
                {billTo.email && <p>{billTo.email}</p>}
            </div>
            <div 
              className="p-4 rounded-lg border-l-4"
              style={{ backgroundColor: LIGHT_BACKGROUND, borderColor: ACCENT_PRIMARY }} // Light accent background with primary border
            >
                <h3 className="text-lg font-semibold mb-2" style={{ color: ACCENT_PRIMARY }}>Ship To</h3>
                <p className="font-bold">{shipTo.name || "N/A"}</p>
                <p>{shipTo.address || "N/A"}</p>
                <p>{shipTo.phone || "N/A"}</p>
            </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="px-8 mb-8">
          <table className="w-full">
            <thead 
              className="text-white border-b-2"
              style={{ backgroundColor: ACCENT_PRIMARY, borderColor: DARK_TEXT }} // Solid Orange Header
            >
              <tr>
                <th className="p-3 text-left">Item #/Description</th>
                <th className="p-3 text-right">Qty.</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-3">
                    <span className="font-medium">{item.name || "Item Name"}</span>
                    {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                  </td>
                  <td className="p-3 text-right">{item.quantity || 0}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(item.amount || 0, selectedCurrency)}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatCurrency((item.quantity || 0) * (item.amount || 0), selectedCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* TOTALS, NOTES, QR CODE */}
        <div className="px-8 flex justify-between items-start mb-8">
            {/* Left Side: Notes and QR Code */}
            <div className="w-2/3 pr-12">
              {notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: ACCENT_PRIMARY }}>
                    Additional Notes
                  </h3>
                  <p className="text-sm text-gray-700 border p-3 rounded-lg" style={{ borderColor: DARK_TEXT }}>{notes}</p>
                </div>
              )}
              
              <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: ACCENT_PRIMARY }}>Scan to Verify</h3>
                  <QRCodeSVG 
                      value={qrValue}
                      size={100}
                      level="L"
                  />
              </div>
            </div>

            {/* Right Side: Totals Summary */}
            <div 
              className="w-1/3 p-4 rounded-lg border-t-2"
              style={{ backgroundColor: LIGHT_BACKGROUND, borderColor: ACCENT_PRIMARY }} // Light accent background with primary border
            >
              <p className="flex justify-between mb-1">
                <span className="font-medium">Sub Total:</span> <span>{formatCurrency(subTotal, selectedCurrency)}</span>
              </p>
              {taxPercentage > 0 && (
                <p className="flex justify-between mb-1">
                  <span className="font-medium">Tax ({taxPercentage}%):</span>{" "}
                  <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
                </p>
              )}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: ACCENT_SECONDARY }}>
                <p className="flex justify-between font-bold text-xl">
                  <span>TOTAL DUE:</span>{" "}
                  <span style={{ color: ACCENT_PRIMARY }}>
                    {formatCurrency(grandTotal, selectedCurrency)}
                  </span>
                </p>
              </div>
            </div>
        </div>

        {/* Footer */}
        <div 
          className="mt-auto p-4 text-center text-sm"
          style={{ color: DARK_TEXT, backgroundColor: LIGHT_BACKGROUND, borderTop: `1px solid ${ACCENT_SECONDARY}` }}
        >
          This is a computer-generated invoice and doesn't require a signature. Thank you for your business.
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template2;