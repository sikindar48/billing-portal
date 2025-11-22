import React, { useState, useEffect } from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Trash2, Plus, Package, Search, Box, Minus, Calculator } from 'lucide-react';
import { Button } from "../components/ui/button";
import { getCurrencySymbol } from '../utils/formatCurrency.js';
import { supabase } from '../integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";

// Sub-component for the searchable product dropdown
const ProductSelector = ({ inventory, onSelect, currencySymbol }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 text-xs justify-between bg-slate-50 border-slate-200 text-slate-600 w-full font-normal hover:bg-slate-100 hover:text-slate-900 px-3"
        >
          <span className="flex items-center gap-2 truncate">
             <Box className="w-3.5 h-3.5 flex-shrink-0" />
             <span className="truncate">Autofill from Inventory</span>
          </span>
          <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products..." className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-xs text-center text-slate-500">No products found.</CommandEmpty>
            <CommandGroup>
              {inventory.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product.id);
                    setOpen(false);
                  }}
                  className="text-xs cursor-pointer flex justify-between items-center py-2"
                >
                  <span className="truncate font-medium">{product.name}</span>
                  <span className="text-slate-400 ml-2 shrink-0 text-[10px]">
                    {currencySymbol}{product.price}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ItemDetails = ({ items, handleItemChange, addItem, removeItem, currencyCode: propCurrencyCode }) => {
  let currencyCode = propCurrencyCode || 'INR';
  const currencySymbol = getCurrencySymbol(currencyCode);

  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true });
                
                if (data) setInventory(data);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
    };
    fetchInventory();
  }, []);

  const handleProductSelect = (index, productId) => {
      const product = inventory.find(p => p.id === productId);
      if (product) {
          handleItemChange(index, 'name', product.name);
          handleItemChange(index, 'description', product.description || '');
          handleItemChange(index, 'amount', product.price);
          
          if (!items[index].quantity) {
              handleItemChange(index, 'quantity', 1);
          }
      }
  };

  return (
    <div className="space-y-6">
      
      
      <div className="space-y-4">
        {items.map((item, index) => (
            <div 
                key={index} 
                className="group relative bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200"
            >
                {/* Inventory Selector (Stacked on mobile) */}
                <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-50 pb-4 gap-3">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Item #{index + 1}</div>
                    <div className="w-full sm:w-auto min-w-[220px]">
                        <ProductSelector 
                            inventory={inventory} 
                            onSelect={(pid) => handleProductSelect(index, pid)}
                            currencySymbol={currencySymbol}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Text Inputs */}
                    <div className="lg:col-span-6 space-y-4">
                        <FloatingLabelInput
                            id={`itemName${index}`}
                            label="Item Name / Service"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="bg-transparent font-medium"
                        />
                        <FloatingLabelInput
                            id={`itemDescription${index}`}
                            label="Description (Optional)"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="text-sm"
                        />
                    </div>

                    {/* Right Column: Numbers & Actions (Responsive Grid) */}
                    <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-12 gap-4 items-start">
                        
                        {/* Quantity - Half width mobile, 3/12 desktop */}
                        <div className="col-span-1 sm:col-span-3">
                            <div className="relative h-14 rounded-lg border border-gray-300 bg-white flex flex-col justify-center">
                                <span className="absolute top-1 left-3 text-[10px] text-gray-500 font-medium">Qty</span>
                                <div className="flex items-center justify-between px-1 mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleItemChange(index, 'quantity', Math.max(1, (item.quantity || 0) - 1));
                                        }}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500 active:bg-slate-200"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <input 
                                        type="number"
                                        className="w-full text-center text-sm font-semibold text-gray-900 focus:outline-none"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleItemChange(index, 'quantity', (item.quantity || 0) + 1);
                                        }}
                                        className="p-1 hover:bg-slate-100 rounded text-indigo-600 active:bg-slate-200"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Price - Half width mobile, 4/12 desktop */}
                        <div className="col-span-1 sm:col-span-4">
                            <FloatingLabelInput
                                id={`itemAmount${index}`}
                                label={`Price (${currencySymbol})`}
                                type="number"
                                value={item.amount === 0 ? '' : item.amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleItemChange(index, 'amount', val === '' ? 0 : parseFloat(val))
                                }}
                            />
                        </div>

                        {/* Total & Delete - Full width mobile, 5/12 desktop */}
                        <div className="col-span-2 sm:col-span-5 flex items-center gap-2">
                            <div className="relative w-full overflow-hidden rounded-lg bg-slate-50 border border-slate-200 group-hover:border-indigo-200 transition-colors h-14 flex flex-col justify-center px-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <Calculator className="w-3 h-3" /> Total
                                </p>
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    {currencySymbol} {(item.quantity * item.amount).toFixed(2)}
                                </p>
                            </div>
                            
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                onClick={(e) => {
                                    e.preventDefault();
                                    removeItem(index);
                                }}
                                disabled={items.length === 1 && !item.name && !item.amount}
                                title="Remove Item"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Add Button */}
      <Button 
        type="button" 
        onClick={(e) => {
            e.preventDefault();
            addItem();
        }} 
        variant="ghost"
        className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-2 font-semibold">
            <div className="bg-slate-100 p-1.5 rounded-md group-hover:bg-indigo-100 transition-colors">
                <Plus className="w-4 h-4" />
            </div>
            Add New Line Item
        </div>
      </Button>
    </div>
  );
};

export default ItemDetails;