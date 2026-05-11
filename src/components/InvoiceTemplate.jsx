import React from 'react';
import { getTemplate } from '../utils/templateRegistry';

const InvoiceTemplate = ({ data, templateNumber }) => {
  const Template = getTemplate(templateNumber);
  return (
    <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center p-20"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <Template data={data} />
    </React.Suspense>
  );
};

export default InvoiceTemplate;
