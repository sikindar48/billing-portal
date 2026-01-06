import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "Invoice Port - Professional Invoice Generator & Billing Software",
  description = "Create professional invoices in minutes with Invoice Port. Free invoice generator with customizable templates, PDF export, client management, and billing automation for freelancers and businesses.",
  keywords = "invoice generator, billing software, professional invoices, PDF invoice, business invoicing, freelancer billing, invoice templates, online invoicing, invoice maker, billing system",
  canonicalUrl = "",
  ogImage = "/og-image.svg",
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
  structuredData = null
}) => {
  const siteUrl = "https://invoiceport.netlify.app"; // Update with your actual domain
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  // Default structured data for the homepage
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Invoice Port",
    "description": "Professional invoice generator and billing software for freelancers and businesses",
    "url": siteUrl,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "description": "Free trial with premium plans available"
    },
    "creator": {
      "@type": "Organization",
      "name": "Invoice Port",
      "url": siteUrl
    },
    "featureList": [
      "Professional invoice templates",
      "PDF export",
      "Client management",
      "Billing automation",
      "Tax calculations",
      "Multi-currency support"
    ]
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:site_name" content="Invoice Port" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content="Invoice Port" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;