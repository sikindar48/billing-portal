import React from 'react';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template2 = ({ data }) => {
  const { billTo, shipTo, invoice, yourCompany, items, taxPercentage, taxAmount, subTotal, grandTotal, notes, selectedCurrency } = data;

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;

  return (
    <BaseTemplate data={data}>
      <div className="bg-white p-8 max-w-4xl mx-auto">
        
        {/* HEADER SECTION: LOGO & INVOICE DETAILS */}
        <div className="flex justify-between mb-4 border-b-2 pb-4">
          <div className="flex flex-col items-start">
            
            {/* --- BRANDING INTEGRATION START: Logo --- */}
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
                    />
                </div>
            )}
            {/* --- BRANDING INTEGRATION END --- */}

            <h1 className="text-2xl font-bold text-cyan-700">
              {yourCompany.name}
            </h1>
            <p>{yourCompany.address}</p>
            <p>{yourCompany.phone}</p>
            
            {/* --- WEBSITE INTEGRATION --- */}
            {yourCompany.website && <p className="text-sm text-cyan-700">{yourCompany.website}</p>}
            {/* --------------------------- */}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-cyan-700">Tax Invoice</h2>
            <p className="text-sm">INVOICE NUMBER: <span className="font-semibold">{invoice.number}</span></p>
            <p className="text-sm">DATE: {invoice.date}</p>
            <p className="text-sm">DUE DATE: <span className="font-semibold">{invoice.paymentDate}</span></p>
          </div>
        </div>

        {/* ADDRESS SECTION */}
        <div className="flex justify-between mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-2 text-cyan-700">Bill To</h3>
            <p>{billTo.name}</p>
            <p>{billTo.address}</p>
            <p>{billTo.phone}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2 text-cyan-700">Ship To</h3>
            <p>{shipTo.name}</p>
            <p>{shipTo.address}</p>
            <p>{shipTo.phone}</p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-8">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-cyan-50">
                <th className="p-2 text-left border border-gray-300">ID</th>
                <th className="p-2 text-left border border-gray-300">
                  Description
                </th>
                <th className="p-2 text-right border border-gray-300">
                  Quantity
                </th>
                <th className="p-2 text-right border border-gray-300">Rate</th>
                <th className="p-2 text-right border border-gray-300">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border border-gray-300">{index + 1}</td>
                  <td className="p-2 border border-gray-300">
                    <span className="font-medium">{item.name}</span>
                    <div className="text-sm text-gray-500">
                      {item.description}
                    </div>
                  </td>
                  <td className="p-2 text-right border border-gray-300">
                    {item.quantity}
                  </td>
                  <td className="p-2 text-right border border-gray-300">
                    {formatCurrency(item.amount, selectedCurrency)}
                  </td>
                  <td className="p-2 text-right border border-gray-300 font-medium">
                    {formatCurrency(item.total, selectedCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS & FOOTER */}
        <div className="flex justify-between">
          
          {/* Notes and QR Code */}
          <div className="w-2/3 pr-8">
            {notes && (
              <div className="text-sm border-t pt-4">
                <h3 className="font-semibold mb-2 text-cyan-700">Notes:</h3>
                <p className="text-gray-600 border-l-4 border-cyan-700 pl-2 italic">{notes}</p>
              </div>
            )}
            
            {/* --- QR CODE INTEGRATION --- */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Scan to Verify:</h3>
                <QRCodeSVG 
                    value={qrValue}
                    size={80}
                    level="L"
                    className="border p-1"
                />
            </div>
            {/* --------------------------- */}
          </div>
          
          {/* Financial Totals */}
          <div className="w-1/3 border-t-2 border-cyan-700 pt-2">
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
              <span>TOTAL DUE:</span>
              <span className="text-cyan-700">{formatCurrency(grandTotal, selectedCurrency)}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template2;