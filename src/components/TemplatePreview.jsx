import React from 'react';
import { templates } from '../utils/templateRegistry';

// Sample data for template previews
const sampleData = {
  billTo: {
    name: "John Doe",
    address: "123 Main St, Anytown, USA",
    phone: "(555) 123-4567"
  },
  shipTo: {
    name: "Jane Smith", 
    address: "456 Elm St, Othertown, USA",
    phone: "(555) 987-6543"
  },
  invoice: {
    date: new Date().toISOString().split('T')[0],
    paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    number: "INV-001",
    taxType: "IGST",
    enableRoundOff: false,
    roundOffAmount: 0
  },
  yourCompany: {
    name: "Your Business Name",
    address: "101 Business St, Tech City",
    phone: "+1 (555) 000-0000",
    website: "www.yourbusiness.com",
    logoUrl: ""
  },
  items: [
    {
      name: "Website Design",
      description: "Homepage and 3 interior pages",
      quantity: 1,
      amount: 2500,
      total: 2500
    },
    {
      name: "SEO Optimization", 
      description: "Initial keyword research and setup",
      quantity: 5,
      amount: 100,
      total: 500
    }
  ],
  taxPercentage: 18,
  taxAmount: 540,
  subTotal: 3000,
  grandTotal: 3540,
  notes: "Thank you for your business!",
  selectedCurrency: "USD"
};

const TemplatePreview = ({ templateIndex, onClick, className = "" }) => {
  const template = templates[templateIndex];
  const TemplateComponent = template.component;

  return (
    <div 
      className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500 ${className}`}
      onClick={onClick}
    >
      <div className="aspect-[210/297] w-full bg-gray-50 relative overflow-hidden">
        {/* Render the actual template in a scaled-down preview */}
        <div className="transform scale-[0.15] origin-top-left w-[667%] h-[667%] pointer-events-none">
          <div className="bg-white">
            <TemplateComponent data={sampleData} />
          </div>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      <div className="p-3 text-center bg-white border-t border-gray-100">
        <p className="font-semibold text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">
          {template.name}
        </p>
      </div>
    </div>
  );
};

export default TemplatePreview;