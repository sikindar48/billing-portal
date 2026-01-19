import React from 'react';
import { format } from 'date-fns';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template7 = ({ data }) => {
  const { billTo = {}, shipTo = {}, invoice = {}, yourCompany = {}, items = [], taxPercentage = 0, taxAmount = 0, subTotal = 0, grandTotal = 0, notes = '', selectedCurrency } = data || {};

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;
  const darkGray = "#4B4B4B"; // Define color variable for reuse

  return (
    <BaseTemplate data={data}>
      <div className="bg-white max-w-4xl mx-auto flex flex-col min-h-[842px]">
        
        {/* HEADER STRIP - Company Info & Logo */}
        <div style={{ backgroundColor: darkGray }} className="p-8 text-white flex justify-between items-center">
            
            {/* Left Side: Logo and Company Details */}
            <div className="flex flex-col items-start">
                {/* --- BRANDING INTEGRATION START: Logo --- */}
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
                {/* --- BRANDING INTEGRATION END --- */}
                <h2 className="text-xl font-bold mt-2">
                  {yourCompany.name || "Your Company Name"}
                </h2>
                <p className="text-sm">{yourCompany.address || "Your Company Address"}</p>
                <p className="text-sm">{yourCompany.phone || "Your Company Phone"}</p>
                {/* --- WEBSITE INTEGRATION --- */}
                {yourCompany.website && <p className="text-xs text-gray-300">{yourCompany.website}</p>}
                {/* --------------------------- */}
            </div>

            {/* Right Side: INVOICE Title */}
            <h1 className="text-5xl font-extrabold tracking-wider">INVOICE</h1>
        </div>

        {/* DETAILS BLOCK - Invoice Dates and Billing Addresses */}
        <div className="p-8 grid grid-cols-3 gap-8 border-b border-gray-200">
            
            {/* Invoice Dates */}
            <div className="border-r border-gray-200 pr-4">
                <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
                <p className="text-sm">
                  <span className="font-semibold">Invoice #:</span> {invoice.number || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Date:</span> {invoice.date ? format(new Date(invoice.date), "MMM dd, yyyy") : "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Due Date:</span> {invoice.paymentDate ? format(new Date(invoice.paymentDate), "MMM dd, yyyy") : "N/A"}
                </p>
            </div>
            
            {/* Billed To */}
            <div className="border-r border-gray-200 pr-4">
                <h3 className="text-lg font-semibold mb-2" style={{ color: darkGray }}>Billed to</h3>
                <p className="font-medium">{billTo.name || "Client Name"}</p>
                <p className="text-sm">{billTo.address || "Client Address"}</p>
                <p className="text-sm">{billTo.phone || "Client Phone"}</p>
                {billTo.email && <p className="text-sm">{billTo.email}</p>}
            </div>

             {/* Ship To (keeping structure consistent) */}
            <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: darkGray }}>Ship to</h3>
                <p className="font-medium">{shipTo.name || "N/A"}</p>
                <p className="text-sm">{shipTo.address || "N/A"}</p>
                <p className="text-sm">{shipTo.phone || "N/A"}</p>
            </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="px-8">
            <table className="w-full">
              <thead style={{ backgroundColor: darkGray, color: "white" }}>
                <tr>
                  <th className="p-3 text-left">Item #/Description</th>
                  <th className="p-3 text-right">Qty.</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-3">
                        <span className="font-medium">{item.name || "Item Name"}</span>
                        {item.description && <div className="text-xs text-gray-600">{item.description}</div>}
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

        {/* TOTALS and NOTES/QR CODE */}
        <div className="p-8 flex justify-between mt-auto">
            
            {/* LEFT SIDE: NOTES & QR CODE */}
            <div className="w-2/3 pr-8">
                {notes && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2" style={{ color: darkGray }}>Terms / Notes:</h3>
                        <p className="text-sm text-gray-700 border p-3 rounded-lg border-gray-300">{notes}</p>
                    </div>
                )}
                
                {/* --- QR CODE INTEGRATION START --- */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: darkGray }}>Scan to Pay/Verify:</h3>
                    <QRCodeSVG 
                        value={qrValue}
                        size={100}
                        level="L"
                        className="p-1 border border-gray-300"
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
                  <p className="flex justify-between">
                    <span>Tax ({taxPercentage}%):</span>{" "}
                    <span>{formatCurrency(taxAmount, selectedCurrency)}</span>
                  </p>
                )}
                <div className="border-t-4 mt-4 pt-3" style={{ borderColor: darkGray }}>
                    <p className="flex justify-between font-bold text-xl">
                      <span>TOTAL DUE:</span> <span style={{ color: darkGray }}>{formatCurrency(grandTotal, selectedCurrency)}</span>
                    </p>
                </div>
            </div>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template7;