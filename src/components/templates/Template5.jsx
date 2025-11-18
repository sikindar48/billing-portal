import React from 'react';
import { format } from 'date-fns';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react';

const Template5 = ({ data = {} }) => {
  const { billTo = {}, shipTo = {}, invoice = {}, yourCompany = {}, items = [], taxPercentage = 0, taxAmount = 0, subTotal = 0, grandTotal = 0, notes = '', selectedCurrency } = data;

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;

  return (
    <BaseTemplate data={data}>
      <div className="bg-white max-w-4xl mx-auto flex flex-col h-full overflow-hidden">
        
        {/* HEADER BLOCK - Logo, Company Info, and Invoice Title */}
        <div className="bg-green-600 text-white p-8 mb-8 flex justify-between items-end">
            
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
              {yourCompany.website && <p className="text-xs text-green-200">{yourCompany.website}</p>}
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
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-600">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Billed To</h3>
                <p className="font-bold">{billTo.name || "Client Name"}</p>
                <p>{billTo.address || "Client Address"}</p>
                <p>{billTo.phone || "Client Phone"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-600">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Ship To</h3>
                <p className="font-bold">{shipTo.name || "N/A"}</p>
                <p>{shipTo.address || "N/A"}</p>
                <p>{shipTo.phone || "N/A"}</p>
            </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="px-8 mb-8">
          <table className="w-full">
            <thead className="bg-green-100 text-gray-700 border-b-2 border-green-600">
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
                  <h3 className="text-lg font-semibold text-green-600 mb-2">
                    Additional Notes
                  </h3>
                  <p className="text-sm text-gray-700 border p-3 rounded-lg">{notes}</p>
                </div>
              )}
              
              <div className="mt-4">
                  <h3 className="text-lg font-semibold text-green-600 mb-2">Scan to Verify</h3>
                  <QRCodeSVG 
                      value={qrValue}
                      size={100}
                      level="L"
                  />
              </div>
            </div>

            {/* Right Side: Totals Summary */}
            <div className="w-1/3 bg-green-50 p-4 rounded-lg border-t-2 border-green-600">
              <p className="flex justify-between mb-1">
                <span className="font-medium">Sub Total:</span> <span>{formatCurrency(subTotal, selectedCurrency)}</span>
              </p>
              {taxPercentage > 0 && (
                <p className="flex justify-between mb-1">
                  <span className="font-medium">Tax ({taxPercentage}%):</span>{" "}
                  <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
                </p>
              )}
              <div className="border-t border-green-300 mt-3 pt-3">
                <p className="flex justify-between font-bold text-xl">
                  <span>TOTAL DUE:</span>{" "}
                  <span className="text-green-800">
                    {formatCurrency(grandTotal, selectedCurrency)}
                  </span>
                </p>
              </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 text-center text-sm text-gray-700 bg-green-100/50 border-t border-green-200">
          This is a computer-generated invoice and doesn't require a signature. Thank you for your business.
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template5;