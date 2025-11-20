import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Trash2, Plus, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from '../utils/formatCurrency.js';

const ItemDetails = ({ items, handleItemChange, addItem, removeItem, currencyCode: propCurrencyCode }) => {
  let currencyCode = propCurrencyCode;
  if (!currencyCode) {
    currencyCode = 'INR';
  }
  const currencySymbol = getCurrencySymbol(currencyCode);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((item, index) => (
            <div 
                key={index} 
                className="group relative bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300/50"
            >
                {/* Row 1: Main Numeric & Name Data */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Item Name - Takes more space */}
                    <div className="md:col-span-5">
                        <FloatingLabelInput
                        id={`itemName${index}`}
                        label="Item Name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="bg-transparent font-medium"
                        />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                        <FloatingLabelInput
                        id={`itemQuantity${index}`}
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                        />
                    </div>

                    {/* Amount/Rate */}
                    <div className="md:col-span-2">
                        <FloatingLabelInput
                        id={`itemAmount${index}`}
                        label={`Price (${currencySymbol})`}
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                        />
                    </div>

                    {/* Total Calculation Display - Read Only Style */}
                    <div className="md:col-span-3 relative">
                         <div className="bg-gray-50 rounded-lg border border-gray-200 h-[50px] flex flex-col justify-center px-4 transition-colors group-hover:bg-blue-50/30 group-hover:border-blue-100">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total</span>
                            <span className="text-lg font-bold text-gray-800">
                                {currencySymbol} {(item.quantity * item.amount).toFixed(2)}
                            </span>
                         </div>
                    </div>
                </div>

                {/* Row 2: Description & Delete Action */}
                <div className="mt-4 flex gap-4 items-start">
                    <div className="flex-grow">
                        <FloatingLabelInput
                            id={`itemDescription${index}`}
                            label="Description (Optional)"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="text-sm text-gray-600"
                        />
                    </div>
                    
                    {/* Delete Button - Fixed with e.preventDefault() */}
                    <div className="flex-shrink-0 pt-1">
                        <Button
                            type="button" 
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors h-10 w-10 rounded-lg border border-transparent hover:border-red-100"
                            onClick={(e) => {
                                e.preventDefault(); // Prevents form submission
                                removeItem(index);
                            }}
                            disabled={items.length === 1 && index === 0 && !item.name && !item.amount} 
                            title="Remove Item"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Add Button - Fixed with e.preventDefault() */}
      <Button 
        type="button" 
        onClick={(e) => {
            e.preventDefault(); // Prevents form submission
            addItem();
        }} 
        variant="outline"
        className="w-full py-8 border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 flex items-center justify-center gap-2 rounded-xl font-semibold text-md group"
      >
        <div className="bg-gray-100 rounded-full p-1 group-hover:bg-blue-100 transition-colors">
            <Plus className="w-5 h-5" />
        </div>
        Add New Line Item
      </Button>
    </div>
  );
};

export default ItemDetails;