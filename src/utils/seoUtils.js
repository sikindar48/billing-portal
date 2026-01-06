// SEO utility functions for dynamic meta tag generation

export const generatePageTitle = (pageTitle, includeAppName = true) => {
  const appName = "Invoice Port";
  if (!includeAppName) return pageTitle;
  return pageTitle ? `${pageTitle} | ${appName}` : appName;
};

export const generateMetaDescription = (description, maxLength = 160) => {
  if (!description) return "Create professional invoices in minutes with Invoice Port. Free invoice generator with customizable templates, PDF export, and billing automation.";
  
  if (description.length <= maxLength) return description;
  
  // Truncate at word boundary
  const truncated = description.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

export const generateKeywords = (pageKeywords = [], baseKeywords = []) => {
  const defaultKeywords = [
    'invoice generator',
    'billing software', 
    'professional invoices',
    'PDF invoice',
    'business invoicing',
    'freelancer billing',
    'invoice templates',
    'online invoicing',
    'GST invoice',
    'invoice maker'
  ];
  
  const allKeywords = [...defaultKeywords, ...baseKeywords, ...pageKeywords];
  // Remove duplicates and return as comma-separated string
  return [...new Set(allKeywords)].join(', ');
};

export const generateCanonicalUrl = (path = '', baseUrl = 'https://invoiceport.netlify.app') => {
  if (!path) return baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const generateStructuredData = (type, data) => {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": type,
    "name": "Invoice Port",
    "url": "https://invoiceport.netlify.app"
  };

  return { ...baseStructuredData, ...data };
};

// Page-specific SEO configurations
export const pageConfigs = {
  home: {
    title: "Invoice Port - Professional Invoice Generator & Billing Software",
    description: "Create professional invoices in minutes with Invoice Port. Free invoice generator with customizable templates, PDF export, GST calculations, and client management for Indian businesses.",
    keywords: ['free invoice maker', 'invoice generator India', 'GST invoice', 'professional invoicing'],
    structuredDataType: "WebApplication"
  },
  
  auth: {
    title: "Sign In to Invoice Port | Professional Invoice Generator",
    description: "Sign in to Invoice Port to access your professional invoice generator. Create, customize, and manage invoices with ease. Free trial available for new users.",
    keywords: ['invoice port login', 'sign in', 'invoice generator login', 'billing software access'],
    structuredDataType: "WebPage"
  },
  
  subscription: {
    title: "Subscription Plans - Invoice Port | Choose Your Billing Plan", 
    description: "Choose the perfect Invoice Port subscription plan for your business. Free trial, Pro monthly (₹149), Pro yearly (₹1499), and Enterprise plans available.",
    keywords: ['invoice port pricing', 'subscription plans', 'billing plans', 'pro plan', 'enterprise invoicing'],
    structuredDataType: "Product"
  },
  
  template: {
    title: "Invoice Templates - Professional Designs | Invoice Port",
    description: "Choose from professional invoice templates designed for Indian businesses. Customizable layouts with GST support, branding options, and PDF export.",
    keywords: ['invoice templates', 'professional invoice designs', 'GST invoice templates', 'customizable invoices'],
    structuredDataType: "WebPage"
  },
  
  history: {
    title: "Invoice History - Manage Your Invoices | Invoice Port",
    description: "View, manage, and track all your invoices in one place. Download PDFs, check payment status, and organize your billing history efficiently.",
    keywords: ['invoice history', 'invoice management', 'invoice tracking', 'billing history'],
    structuredDataType: "WebPage"
  }
};

export const getSEOConfig = (pageName, customConfig = {}) => {
  const config = pageConfigs[pageName] || pageConfigs.home;
  return {
    title: generatePageTitle(customConfig.title || config.title, false),
    description: generateMetaDescription(customConfig.description || config.description),
    keywords: generateKeywords(customConfig.keywords || [], config.keywords || []),
    canonicalUrl: generateCanonicalUrl(customConfig.path),
    structuredData: generateStructuredData(
      customConfig.structuredDataType || config.structuredDataType,
      customConfig.structuredData || {}
    )
  };
};