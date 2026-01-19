import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "Invoice Port – Professional Invoice Generator & GST Billing Software",
  description = "Create professional invoices instantly with Invoice Port. Free GST-compliant invoice generator for Indian businesses, freelancers & startups. Customizable templates, PDF export, client management & automated billing. Start free today!",
  keywords = "invoice generator India, GST invoice software, professional billing software, free invoice maker, business invoicing India, freelancer billing, invoice templates, online invoicing, GST compliant invoices, Indian invoice generator",
  canonicalUrl = "",
  ogImage = "/og-image.webp",
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
  noFollow = false,
  structuredData = null,
  isHomepage = false
}) => {
  const siteUrl = "https://invoiceport.live";
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  // Enhanced structured data for homepage
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Invoice Port",
    "alternateName": "InvoicePort",
    "description": "Professional GST-compliant invoice generator and billing software for Indian businesses, freelancers, and startups",
    "url": siteUrl,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "2.0",
    "releaseNotes": "Enhanced GST compliance and multi-template support",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "description": "Free plan available with premium plans starting at ₹149/month",
      "availability": "https://schema.org/InStock"
    },
    "creator": {
      "@type": "Organization",
      "name": "Invoice Port",
      "url": siteUrl,
      "logo": `${siteUrl}/logo.svg`,
      "sameAs": [
        `${siteUrl}`,
        "https://www.linkedin.com/company/invoiceport",
        "https://twitter.com/invoiceport"
      ]
    },
    "featureList": [
      "GST-compliant invoice templates",
      "Professional PDF export",
      "Client & customer management",
      "Automated billing & reminders",
      "Tax calculations (GST, IGST, CGST, SGST)",
      "Multi-currency support",
      "Custom branding & logos",
      "Invoice tracking & analytics",
      "Mobile-responsive design",
      "Secure cloud storage"
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": "Business owners, freelancers, startups, small businesses in India"
    },
    "inLanguage": "en-IN",
    "serviceArea": {
      "@type": "Country",
      "name": "India"
    }
  };

  // Determine robots directive
  const robotsContent = noIndex || noFollow 
    ? `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`
    : "index, follow";

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Only add canonical for indexable pages */}
      {!noIndex && <link rel="canonical" href={fullCanonicalUrl} />}
      
      {/* Robots */}
      <meta name="robots" content={robotsContent} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Invoice Port - Professional Invoice Generator" />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:site_name" content="Invoice Port" />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:image:alt" content="Invoice Port - Professional Invoice Generator" />
      <meta name="twitter:site" content="@invoiceport" />
      <meta name="twitter:creator" content="@invoiceport" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content="Invoice Port" />
      <meta name="language" content="en-IN" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.country" content="India" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      
      {/* Mobile & Responsive */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Invoice Port" />
      
      {/* Structured Data - Only for indexable pages */}
      {!noIndex && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData || defaultStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;