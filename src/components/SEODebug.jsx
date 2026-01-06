import React, { useEffect, useState } from 'react';

// Development component to debug SEO meta tags
const SEODebug = ({ enabled = false }) => {
  const [metaTags, setMetaTags] = useState({});

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === 'production') return;

    const extractMetaTags = () => {
      const tags = {};
      
      // Get title
      tags.title = document.title;
      
      // Get meta tags
      const metaElements = document.querySelectorAll('meta');
      metaElements.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          tags[name] = content;
        }
      });
      
      // Get canonical
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        tags.canonical = canonical.getAttribute('href');
      }
      
      setMetaTags(tags);
    };

    // Extract on mount and when DOM changes
    extractMetaTags();
    
    const observer = new MutationObserver(extractMetaTags);
    observer.observe(document.head, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [enabled]);

  if (!enabled || process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      maxHeight: '100vh',
      overflow: 'auto',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '16px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: '2px solid #4F46E5',
      borderRadius: '8px',
      margin: '8px'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#4F46E5' }}>SEO Debug Panel</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <strong style={{ color: '#10B981' }}>Title:</strong>
        <div style={{ wordBreak: 'break-word', marginTop: '4px' }}>
          {metaTags.title || 'No title found'}
        </div>
        <small style={{ color: '#6B7280' }}>
          Length: {metaTags.title?.length || 0} chars
        </small>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ color: '#10B981' }}>Description:</strong>
        <div style={{ wordBreak: 'break-word', marginTop: '4px' }}>
          {metaTags.description || 'No description found'}
        </div>
        <small style={{ color: '#6B7280' }}>
          Length: {metaTags.description?.length || 0} chars
        </small>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ color: '#10B981' }}>Keywords:</strong>
        <div style={{ wordBreak: 'break-word', marginTop: '4px' }}>
          {metaTags.keywords || 'No keywords found'}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ color: '#10B981' }}>Canonical:</strong>
        <div style={{ wordBreak: 'break-word', marginTop: '4px' }}>
          {metaTags.canonical || 'No canonical found'}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ color: '#10B981' }}>Open Graph:</strong>
        <div style={{ marginTop: '4px' }}>
          <div><strong>og:title:</strong> {metaTags['og:title'] || 'Not set'}</div>
          <div><strong>og:description:</strong> {metaTags['og:description'] || 'Not set'}</div>
          <div><strong>og:image:</strong> {metaTags['og:image'] || 'Not set'}</div>
          <div><strong>og:url:</strong> {metaTags['og:url'] || 'Not set'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ color: '#10B981' }}>Twitter:</strong>
        <div style={{ marginTop: '4px' }}>
          <div><strong>twitter:card:</strong> {metaTags['twitter:card'] || 'Not set'}</div>
          <div><strong>twitter:title:</strong> {metaTags['twitter:title'] || 'Not set'}</div>
          <div><strong>twitter:description:</strong> {metaTags['twitter:description'] || 'Not set'}</div>
        </div>
      </div>

      <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '16px' }}>
        This panel only shows in development mode. Add ?seo-debug=true to URL to enable.
      </div>
    </div>
  );
};

export default SEODebug;