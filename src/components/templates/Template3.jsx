import React from 'react';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template3 = ({ data }) => {
  const { billTo, shipTo, invoice, yourCompany, items, taxPercentage, taxAmount, subTotal, grandTotal, notes, selectedCurrency } = data;

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;
  const blueAccent = "#3b82f6"; // Tailwind blue-500 equivalent

  return (
    <BaseTemplate data={data}>
      <div className="bg-blue-500 text-white p-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            {/* --- BRANDING INTEGRATION START: Logo & Website --- */}
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
                        // Removed borders/shadows as requested previously
                    />
                </div>
            )}
            <div className="text-white inline-block">
              <h1 className="text-2xl font-bold" id="company-name">
                {yourCompany?.name || "Your Company Name"}
              </h1>
            </div>
            <p className="mt-2 text-sm">
              {yourCompany?.address || "Your Company Address"}
            </p>
            <p className="text-sm">{yourCompany?.phone || "Your Company Phone"}</p>
            {yourCompany.website && <p className="text-sm">{yourCompany.website}</p>}
            {/* --- BRANDING INTEGRATION END --- */}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">BILLED TO</h2>
            <p className="text-sm">{billTo.name}</p>
            <p className="text-sm">{billTo.address}</p>
            <p className="text-sm">{billTo.phone}</p>
          </div>
        </div>
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">SHIP TO</h2>
            <p className="text-sm">{shipTo.name}</p>
            <p className="text-sm">{shipTo.address}</p>
            <p className="text-sm">{shipTo.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-sm">Invoice #: {invoice.number}</p>
            <p className="text-sm">Invoice Date: {invoice.date}</p>
            <p className="text-sm">Due Date: {invoice.paymentDate}</p>
            <p className="text-xl font-bold mt-2">Due Amount: {formatCurrency(grandTotal, selectedCurrency)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-blue-500 -mt-[42px] w-[92%] mx-auto bg-white">
        
        {/* ITEMS TABLE */}
        <div id="item-data" className="w-full mb-8">
          <div className="bg-blue-200 flex rounded-t">
            <div className="p-2 w-12 text-gray-700 font-semibold">#</div>
            <div className="p-2 flex-grow text-left text-gray-700 font-semibold">
              ITEM NAME/ITEM DESCRIPTION
            </div>
            <div className="p-2 flex-1 text-right text-gray-700 font-semibold">QTY.</div>
            <div className="p-2 flex-1 text-right text-gray-700 font-semibold">AMOUNT</div>
          </div>
          {items.map((item, index) => (
            <div key={index} className="flex border-t border-b border-blue-100">
              <div className="p-2 w-12 text-left text-sm">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="p-2 flex-1 text-sm">
                <p className="font-semibold">{item.name}</p>
                {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
              </div>
              <div className="p-2 w-24 text-right text-sm">{item.quantity}</div>
              <div className="p-2 flex-1 text-right text-sm font-medium">
                {formatCurrency(item.total, selectedCurrency)}
              </div>
            </div>
          ))}
        </div>
        
        {/* TOTALS SUMMARY */}
        <div className="flex justify-end pr-4">
          <div className="w-1/2">
            <div className="flex justify-between mb-2 p-2">
              <span>Sub Total:</span>
              <span>{formatCurrency(subTotal, selectedCurrency)}</span>
            </div>
            {taxPercentage > 0 && (
              <div className="flex justify-between mb-2 p-2">
                <span>Tax ({taxPercentage}%):</span>
                <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold bg-blue-500 text-white p-3 mt-4">
              <span className="text-left">TOTAL DUE</span>
              <span>{formatCurrency(grandTotal, selectedCurrency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SECTION: NOTES & QR CODE */}
      <div className="w-[92%] mx-auto mt-6 flex justify-between items-end pb-8">
        
        {/* NOTES (Moved to the bottom left) */}
        <div className="w-2/3 pr-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
          <p className="text-sm text-gray-600 border p-3 rounded-lg">{notes || "N/A"}</p>
        </div>

        {/* QR CODE (Moved to the bottom right, next to notes) */}
        <div className="w-1/3 flex flex-col items-end">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Scan to Pay/Verify</h3>
          <QRCodeSVG 
              value={qrValue}
              size={100}
              level="L"
              className="p-1 border border-gray-300 rounded"
          />
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template3;