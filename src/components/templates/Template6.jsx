import React from 'react';
import { format } from 'date-fns';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template6 = ({ data }) => {
  const { billTo = {}, shipTo = {}, invoice = {}, yourCompany = {}, items = [], taxPercentage = 0, taxAmount = 0, subTotal = 0, grandTotal = 0, notes = '', selectedCurrency } = data || {};

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;
  const blueAccent = "#14A8DE"; // Defined for clarity

  return (
    <BaseTemplate data={data}>
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          
          {/* LEFT SIDE: COMPANY INFO & LOGO */}
          <div>
            {/* --- BRANDING INTEGRATION START: Logo --- */}
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
                    />
                </div>
            )}
            {/* --- BRANDING INTEGRATION END --- */}
            
            <h2 className="text-2xl font-bold" style={{ color: blueAccent }}>
              {yourCompany.name || "Company Name"}
            </h2>
            <p>{yourCompany.address || "Company Address"}</p>
            <p>{yourCompany.phone || "Company Phone"}</p>
            {/* --- WEBSITE INTEGRATION --- */}
            {yourCompany.website && <p className="text-sm" style={{ color: blueAccent }}>{yourCompany.website}</p>}
            {/* --------------------------- */}
          </div>
          
          {/* RIGHT SIDE: INVOICE DETAILS */}
          <div className="text-right">
            <h1 className="text-3xl font-thin mb-4">Tax Invoice</h1>
            <p>
              <span className="font-semibold">Invoice No:</span>{" "}
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
        </div>

        {/* ADDRESSES (Fixed to use two columns correctly) */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Billed to</h3>
            <p>{billTo.name || "Client Name"}</p>
            <p>{billTo.address || "Client Address"}</p>
            <p>{billTo.phone || "Client Phone"}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Ship to</h3>
            <p>{shipTo.name || "N/A"}</p>
            <p>{shipTo.address || "N/A"}</p>
            <p>{shipTo.phone || "N/A"}</p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full mb-8 border border-gray-300">
          <thead style={{ backgroundColor: blueAccent }}>
            <tr>
              <th className="p-2 text-left border-b border-gray-300 text-white">
                Item #/Item description
              </th>
              <th className="p-2 text-right border-b border-gray-300 text-white">
                Quantity
              </th>
              <th className="p-2 text-right border-b border-gray-300 text-white">
                Rate
              </th>
              <th className="p-2 text-right border-b border-gray-300 text-white">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="p-2 border border-gray-300">
                  <p className="font-semibold">{item.name || "Item Name"}</p>
                  <p className="text-sm text-gray-600">
                    {item.description || "Item Description"}
                  </p>
                </td>
                <td className="p-2 text-right border border-gray-300">
                  {item.quantity || 0}
                </td>
                <td className="p-2 text-right border border-gray-300">
                  {formatCurrency(item.amount || 0, selectedCurrency)}
                </td>
                <td className="p-2 text-right border border-gray-300">
                  {formatCurrency((item.amount || 0) * (item.quantity || 0), selectedCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS and FOOTER/NOTES/QR */}
        <div className="flex justify-between items-end">
            {/* LEFT SIDE: QR CODE */}
            <div className="w-1/3">
                <h3 className="text-lg font-semibold mb-2" style={{ color: blueAccent }}>Scan to Verify</h3>
                <QRCodeSVG 
                    value={qrValue}
                    size={100}
                    level="L"
                    className="border p-1"
                />
            </div>
            
            {/* RIGHT SIDE: FINANCIAL TOTALS */}
            <div className="w-1/2">
                <table className="w-full border border-gray-300">
                    <tbody>
                    <tr>
                        <td className="p-2 text-right font-semibold border border-gray-300">
                        Sub Total
                        </td>
                        <td className="p-2 text-right border border-gray-300">
                        {formatCurrency(subTotal, selectedCurrency)}
                        </td>
                    </tr>
                    {taxPercentage > 0 && (
                        <tr>
                        <td className="p-2 text-right font-semibold border border-gray-300">
                            Tax ({taxPercentage}%)
                        </td>
                        <td className="p-2 text-right border border-gray-300">
                            {formatCurrency(taxAmount, selectedCurrency)}
                        </td>
                        </tr>
                    )}
                    <tr className="text-white" style={{ backgroundColor: blueAccent }}>
                        <td className="p-2 text-right font-semibold border border-gray-300">
                        Total Due Amount
                        </td>
                        <td className="p-2 text-right border border-gray-300">
                        {formatCurrency(grandTotal, selectedCurrency)}
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* NOTES SECTION */}
        <div className="text-center text-sm border-t pt-4 mt-4">
          <p>{notes}</p>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template6;