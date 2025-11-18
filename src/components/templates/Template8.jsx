import React from 'react';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template8 = ({ data }) => {
  const { billTo, shipTo, invoice, yourCompany, items, taxPercentage, taxAmount, subTotal, grandTotal, notes, selectedCurrency } = data;

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;
  const blueAccent = "#3C8BF6";

  return (
    <BaseTemplate data={data}>
      <div
        className="bg-gray-100 w-full h-full flex flex-col"
        style={{ margin: "0", padding: "16px" }}
      >
        {/* HEADER SECTION - Company Sender Details */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-300">
          
          {/* LEFT SIDE: SENDER (Your Company Info & Logo) */}
          <div className="flex flex-col items-start">
            {yourCompany.logoUrl && (
                <div className="mb-2">
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
            <h2 className="text-2xl font-bold mt-2" style={{ color: blueAccent }}>
              {yourCompany.name || "Your Company Name"}
            </h2>
            <p className="text-sm">{yourCompany.address || "Company Address"}</p>
            <p className="text-sm">{yourCompany.phone || "Company Phone"}</p>
            {yourCompany.website && <p className="text-xs" style={{ color: blueAccent }}>{yourCompany.website}</p>}
          </div>
          
          {/* RIGHT SIDE: INVOICE TITLE */}
          <h1 className="text-5xl font-extrabold" style={{ color: blueAccent }}>
            INVOICE
          </h1>
        </div>

        {/* ADDRESSES & INVOICE DETAILS */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          
          {/* COLUMN 1: Bill To */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Billed to</h3>
            <p className="font-bold">{billTo.name}</p>
            <p>{billTo.address}</p>
            <p>{billTo.phone}</p>
          </div>
          
          {/* COLUMN 2: Ship To (Added for completeness, assuming relevant) */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Ship to</h3>
            <p className="font-bold">{shipTo.name || 'N/A'}</p>
            <p>{shipTo.address || 'N/A'}</p>
            <p>{shipTo.phone || 'N/A'}</p>
          </div>
          
          {/* COLUMN 3: Invoice Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Invoice Details</h3>
            <p>
              <span className="font-semibold">Invoice #:</span> {invoice.number}
            </p>
            <p>
              <span className="font-semibold">Invoice Date:</span>{" "}
              {invoice.date}
            </p>
            <p>
              <span className="font-semibold">Due Date:</span>{" "}
              {invoice.paymentDate}
            </p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full mb-8">
          <thead style={{ backgroundColor: blueAccent, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-right">Quantity</th>
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
                    <span className="font-medium">{item.name}</span>
                    {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                </td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-right">
                  {formatCurrency(item.amount, selectedCurrency)}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(item.quantity * item.amount, selectedCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS & NOTES/QR CODE */}
        <div className="flex justify-between mb-8 mt-auto"> {/* mt-auto pushes this block down */}
            {/* LEFT SIDE: QR Code & Notes */}
            <div className="w-2/3 pr-8">
                {notes && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Notes:</h3>
                    <p className="text-gray-700 text-sm border p-3 rounded-lg border-gray-300">{notes}</p>
                  </div>
                )}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Scan to Pay/Verify</h3>
                    <QRCodeSVG 
                        value={qrValue}
                        size={100}
                        level="L"
                        className="p-1 border border-gray-300"
                    />
                </div>
            </div>
            
            {/* RIGHT SIDE: Financial Totals */}
            <div className="w-1/3">
                <div className="flex justify-between mb-2">
                  <span>Sub Total:</span>
                  <span>{formatCurrency(subTotal, selectedCurrency)}</span>
                </div>
                {taxPercentage > 0 && (
                  <div className="flex justify-between mb-2">
                    <span>Tax ({taxPercentage}%):</span>
                    <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl mt-4 border-t-4 pt-3" style={{ borderColor: blueAccent }}>
                  <span>TOTAL DUE:</span>
                  <span style={{ color: blueAccent }}>
                    {formatCurrency(grandTotal, selectedCurrency)}
                  </span>
                </div>
            </div>
        </div>
        
        {/* FOOTER - Minimalist closing statement */}
        <footer className="pt-4 text-center text-sm text-gray-700 border-t border-gray-300">
           Thank you for your business.
        </footer>
      </div>
    </BaseTemplate>
  );
};

export default Template8;