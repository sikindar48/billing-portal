import React from 'react';
import { format } from 'date-fns';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template4 = ({ data }) => {
  const { billTo = {}, shipTo = {}, invoice = {}, yourCompany = {}, items = [], taxPercentage = 0, taxAmount = 0, subTotal = 0, grandTotal = 0, notes = '', selectedCurrency } = data || {};

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;
  
  return (
    <BaseTemplate data={data}>
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          
          {/* LEFT SIDE: INVOICE TITLE & DATES */}
          <div>
            <h1 className="text-4xl font-bold text-purple-600 mb-4">Invoice</h1>
            <p>
              <span className="font-semibold">Invoice#:</span>{" "}
              {invoice.number || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Invoice Date:</span>{" "}
              {invoice.date
                ? format(new Date(invoice.date), "MMM dd, yyyy")
                : "N/A"}
            </p>
            <p>
              <span className="font-semibold">Due Date:</span>{" "}
              {invoice.paymentDate
                ? format(new Date(invoice.paymentDate), "MMM dd, yyyy")
                : "N/A"}
            </p>
          </div>
          
          {/* RIGHT SIDE: COMPANY INFO & LOGO (FIXED ALIGNMENT) */}
          <div className="text-right flex flex-col items-end">
            
            {/* Logo is now displayed above the text block */}
            {yourCompany.logoUrl && (
                <div className="mb-3">
                    <img 
                        src={yourCompany.logoUrl} 
                        alt={`${yourCompany.name} Logo`} 
                        style={{ 
                            maxWidth: '180px', 
                            maxHeight: '90px', 
                            objectFit: 'contain' 
                        }} 
                        // Removed float-right
                        className=""
                    />
                </div>
            )}
            
            {/* Company text details */}
            <div>
                <h2 className="text-2xl font-bold">
                  {yourCompany.name || "Company Name"}
                </h2>
                <p>{yourCompany.address || "Company Address"}</p>
                <p>{yourCompany.phone || "Company Phone"}</p>
                {/* --- WEBSITE INTEGRATION --- */}
                {yourCompany.website && <p className="text-sm text-purple-600">{yourCompany.website}</p>}
                {/* --------------------------- */}
            </div>
          </div>
        </div>

        <div className="border-b-2 border-gray-300 mb-8"></div> {/* Added separator for clean break */}

        {/* ADDRESSES */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">
              Billed by
            </h3>
            <p>
              <strong>{yourCompany.name || "Company Name"}</strong>
            </p>
            <p>{yourCompany.address || "Company Address"}</p>
            <p>{yourCompany.phone || "Company Phone"}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">
              Billed to
            </h3>
            <p>
              <strong>{billTo.name || "Client Name"}</strong>
            </p>
            <p>{billTo.address || "Client Address"}</p>
            <p>{billTo.phone || "Client Phone"}</p>
            {billTo.email && <p>{billTo.email}</p>}
          </div>
        </div>
        
        {/* Note: Ship To is not explicitly shown in the original template, so Bill To is used for both sections */}

        {/* ITEMS TABLE */}
        <table className="w-full mb-8 border border-gray-300">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="p-2 text-left border border-gray-300">
                Item #/Item Description
              </th>
              <th className="p-2 text-right border border-gray-300">Qty.</th>
              <th className="p-2 text-right border border-gray-300">Rate</th>
              <th className="p-2 text-right border border-gray-300">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="bg-gray-100">
                <td className="p-2 border border-gray-300">
                  {`${index + 1}. ${item.name || "Item Name"}`}
                  <br />
                  <span className="text-sm text-gray-600">
                    {item.description || "Item Description"}
                  </span>
                </td>
                <td className="p-2 text-right border border-gray-300">
                  {item.quantity || 0}
                </td>
                <td className="p-2 text-right border border-gray-300">
                  {formatCurrency(item.amount || 0, selectedCurrency)}
                </td>
                <td className="p-2 text-right border border-gray-300">
                  {formatCurrency((item.quantity || 0) * (item.amount || 0), selectedCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS AND NOTES/QR CODE */}
        <div className="flex justify-between">
            {/* LEFT SIDE: NOTES & QR CODE */}
            <div className="w-2/3 pr-8">
                {notes && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-purple-600 mb-2">Note</h3>
                        <p className="text-sm text-gray-700">{notes}</p>
                    </div>
                )}
                
                {/* --- QR CODE INTEGRATION --- */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-purple-600 mb-2">Scan to Pay/Verify</h3>
                    <QRCodeSVG 
                        value={qrValue}
                        size={100}
                        level="L"
                        className="border p-1"
                    />
                </div>
                {/* --- QR CODE INTEGRATION END --- */}
            </div>

            {/* RIGHT SIDE: FINANCIAL TOTALS */}
            <div className="w-1/3">
                <p className="flex justify-between">
                  <span>Sub Total:</span> <span>{formatCurrency(subTotal, selectedCurrency)}</span>
                </p>
                {taxPercentage > 0 && (
                  <>
                    <p className="flex justify-between">
                      <span>Tax({taxPercentage}%):</span> <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
                    </p>
                  </>
                )}
                <hr className="my-2 border-purple-600" />
                <p className="flex justify-between font-bold text-lg mt-2 text-purple-600">
                  <span>TOTAL DUE:</span> <span>{formatCurrency(grandTotal, selectedCurrency)}</span>
                </p>
            </div>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template4;