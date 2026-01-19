import React from 'react';
import { format } from 'date-fns';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component

const Template9 = ({ data }) => {
  const { billTo = {}, shipTo = {}, invoice = {}, yourCompany = {}, items = [], taxPercentage = 0, taxAmount = 0, subTotal = 0, grandTotal = 0, notes = '', selectedCurrency } = data || {};

  const qrValue = `Invoice: ${invoice.number}, Total: ${formatCurrency(grandTotal, selectedCurrency)}, Due: ${invoice.paymentDate}`;
  const orangeAccent = "text-orange-600";
  const orangeBg = "bg-orange-600";

  return (
    <BaseTemplate data={data}>
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          
          {/* LEFT SIDE: INVOICE TITLE, LOGO, COMPANY INFO */}
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
            
            <h1 className={`text-3xl font-bold ${orangeAccent} mb-2`}>Invoice</h1>
            <h2 className="text-xl font-bold">
              {yourCompany.name || "Your Company Name"}
            </h2>
            <p>{yourCompany.address || "Company Address"}</p>
            <p>{yourCompany.phone || "Company Phone"}</p>
            {/* --- WEBSITE INTEGRATION --- */}
            {yourCompany.website && <p className={`text-sm ${orangeAccent}`}>{yourCompany.website}</p>}
            {/* --------------------------- */}
          </div>
          
          {/* RIGHT SIDE: INVOICE DETAILS */}
          <div className="text-right">
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
        </div>

        {/* ADDRESSES */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-orange-50 p-4 rounded">
            <h3 className={`text-lg font-semibold ${orangeAccent} mb-2`}>
              Billed by
            </h3>
            <p>{yourCompany.name || "Your Company Name"}</p>
            <p>{yourCompany.address || "Your Company Address"}</p>
            <p>{yourCompany.phone || "Company Phone"}</p> {/* Added phone number */}
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <h3 className={`text-lg font-semibold ${orangeAccent} mb-2`}>
              Billed to
            </h3>
            <p>{billTo.name || "Client Name"}</p>
            <p>{billTo.address || "Client Address"}</p>
            <p>{billTo.phone || "Client Phone"}</p>
            {billTo.email && <p>{billTo.email}</p>}
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="w-full mb-8 overflow-hidden rounded-lg border border-orange-50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${orangeBg} text-white`}>
                <tr>
                  <th className="p-2 text-left">Item #/Item description</th>
                  <th className="p-2 text-right">Qty.</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Fixed alternating row colors */}
                {items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-orange-50" : "bg-white"}>
                    <td className="p-2">
                        <span className="font-medium">{item.name || "Item Name"}</span>
                        {item.description && <div className="text-sm text-gray-600">{item.description}</div>}
                    </td>
                    <td className="p-2 text-right">{item.quantity || 0}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(item.amount || 0, selectedCurrency)}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(
                        (item.quantity || 0) * (item.amount || 0),
                        selectedCurrency
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* TOTALS and NOTES/QR CODE */}
        <div className="flex justify-between mb-8">
            
            {/* LEFT SIDE: QR Code */}
            <div className="w-1/3">
                <h3 className={`text-lg font-semibold ${orangeAccent} mb-2`}>Scan to Pay/Verify</h3>
                <QRCodeSVG 
                    value={qrValue}
                    size={100}
                    level="L"
                    className="border p-1"
                />
            </div>
            
            {/* RIGHT SIDE: Financial Totals (Fixed alignment) */}
            <div className="w-1/2 bg-orange-50 p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Sub Total:</span>
                  <span className="text-right">{formatCurrency(subTotal, selectedCurrency)}</span>
                </div>
                {taxPercentage > 0 && (
                  <div className="flex justify-between mb-2">
                    <span>Tax ({taxPercentage}%):</span>
                    <span className="text-right">{formatCurrency(taxAmount, selectedCurrency)}</span>
                  </div>
                )}
                <div className={`flex justify-between font-bold text-lg mt-2 border-t pt-2 border-orange-200 ${orangeAccent}`}>
                  <span>TOTAL DUE:</span>
                  <span className="text-right">
                    {formatCurrency(grandTotal, selectedCurrency)}
                  </span>
                </div>
            </div>
        </div>
        
        {notes && (
          <div className="mb-8">
            <h3 className={`text-lg font-semibold ${orangeAccent} mb-2`}>
              Remarks
            </h3>
            <p className="text-gray-700">{notes}</p>
          </div>
        )}
      </div>
    </BaseTemplate>
  );
};

export default Template9;