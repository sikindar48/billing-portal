import React from 'react';
import { format } from 'date-fns';
import BaseTemplate from './BaseTemplate';
import { formatCurrency } from '../../utils/formatCurrency';
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
  const primaryColor = "text-indigo-600";
  const primaryBg = "bg-indigo-600";

  return (
    <BaseTemplate data={data}>
      <div className="bg-white min-h-[297mm] flex flex-col font-sans text-gray-800">
        {/* Top Header Section */}
        <div className={`${primaryBg} text-white p-10 flex justify-between items-center`}>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">Tax Invoice</h1>
            <p className="text-indigo-100 opacity-80">#{invoice.number || "N/A"}</p>
          </div>
          <div className="text-right">
            {yourCompany.logoUrl ? (
              <img 
                src={yourCompany.logoUrl} 
                alt="Logo" 
                className="h-16 w-auto ml-auto brightness-0 invert" 
              />
            ) : (
              <h2 className="text-2xl font-bold">{yourCompany.name || "Your Company"}</h2>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
          <div className="p-8 border-r border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Issued By</h3>
            <div className="text-sm">
              <p className="font-bold text-gray-900">{yourCompany.name}</p>
              <p className="mt-1 opacity-70 whitespace-pre-line">{yourCompany.address}</p>
              <p className="mt-1 opacity-70">{yourCompany.phone}</p>
            </div>
          </div>
          <div className="p-8 border-r border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</h3>
            <div className="text-sm">
              <p className="font-bold text-gray-900">{billTo.name}</p>
              <p className="mt-1 opacity-70 whitespace-pre-line">{billTo.address}</p>
              <p className="mt-1 opacity-70">{billTo.phone}</p>
              {billTo.email && <p className="mt-1 opacity-70">{billTo.email}</p>}
            </div>
          </div>
          <div className="p-8 bg-gray-50/50">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Invoice Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">Date:</span>
                <span className="font-medium">{invoice.date ? format(new Date(invoice.date), "dd MMM yyyy") : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Due Date:</span>
                <span className="font-medium text-red-500">{invoice.paymentDate ? format(new Date(invoice.paymentDate), "dd MMM yyyy") : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Currency:</span>
                <span className="font-medium">{selectedCurrency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-grow p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b-2 border-gray-900">
                <th className="py-4 font-bold uppercase tracking-wider">Description</th>
                <th className="py-4 font-bold uppercase tracking-wider text-center">Qty</th>
                <th className="py-4 font-bold uppercase tracking-wider text-right">Price</th>
                <th className="py-4 font-bold uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-5">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="py-5 text-center font-medium">{item.quantity}</td>
                  <td className="py-5 text-right font-medium">{formatCurrency(item.amount, selectedCurrency)}</td>
                  <td className="py-5 text-right font-bold text-gray-900">{formatCurrency(item.quantity * item.amount, selectedCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div className="mt-auto p-10 bg-gray-900 text-white flex justify-between items-end">
          <div className="flex gap-6 items-center">
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG value={qrValue} size={70} />
            </div>
            <div className="max-w-xs">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Notes</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed italic">{notes || "Thank you for your business. Please reach out if you have any questions."}</p>
            </div>
          </div>

          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subTotal, selectedCurrency)}</span>
            </div>
            {taxPercentage > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax ({taxPercentage}%):</span>
                <span className="font-medium">+{formatCurrency(taxAmount, selectedCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-700 pt-3">
              <span className="font-black text-xl uppercase tracking-tighter">Amount Due</span>
              <span className="font-black text-2xl text-indigo-400">{formatCurrency(grandTotal, selectedCurrency)}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template10;
