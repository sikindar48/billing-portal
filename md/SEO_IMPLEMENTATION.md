# InvoicePort — SEO Implementation

> Last updated: March 28, 2026

---

## Strategy

**Primary keywords:** invoice generator India, GST invoice software, professional billing software

**Target audience:** Indian freelancers, small businesses, startups needing GST-compliant invoicing

---

## Technical Implementation

### Meta Tags (`index.html`)

- Title, description, keywords optimised for primary terms
- Open Graph tags for social sharing (1200×630 image)
- Twitter Card (large image)
- Geo-targeting: `geo.region = IN`, `geo.country = IN`
- JSON-LD structured data: `WebApplication` schema with features + pricing

### SEO Component (`src/components/SEO.jsx`)

React Helmet Async wrapper used on every page. Supports:

- Per-page `title`, `description`, `keywords`
- `noIndex` / `noFollow` flags (used on auth, profile, dashboard)
- `canonicalUrl`
- `structuredData` (JSON-LD injection)

### Page SEO Config

| Page            | Indexed | Notes                                      |
| --------------- | ------- | ------------------------------------------ |
| `/`             | ✅ Yes  | Full WebApplication schema, primary target |
| `/subscription` | ✅ Yes  | Product schema with pricing offers         |
| `/auth`         | ❌ No   | `noIndex: true`                            |
| `/dashboard`    | ❌ No   | `noIndex: true`                            |
| `/template`     | ❌ No   | Protected route — requires login           |
| `/profile`      | ❌ No   | `noIndex: true`                            |

---

## Sitemap (`public/sitemap.xml`)

Includes all public indexable pages with priority and `lastmod` dates. Domain: `https://www.invoiceport.live`.

---

## robots.txt (`public/robots.txt`)

```
User-agent: *
Allow: /
Allow: /auth
Allow: /subscription

Disallow: /admin
Disallow: /template        # protected — requires login
Disallow: /dashboard
Disallow: /profile
Disallow: /branding
Disallow: /invoice-history
Disallow: /inventory
Disallow: /confirm-email

Sitemap: https://www.invoiceport.live/sitemap.xml
```

> Fixed in Phase 4 — `Allow: /template` removed, `Disallow: /template` added.

---

## Netlify Canonical Redirect

Non-www redirects to www to prevent duplicate content:

```toml
[[redirects]]
  from = "https://invoiceport.live/*"
  to   = "https://www.invoiceport.live/:splat"
  status = 301
  force  = true
```

---

## Checklist

- [x] HTML meta tags (title, description, OG, Twitter)
- [x] React Helmet Async integration
- [x] SEO component with per-page config
- [x] Sitemap (www.invoiceport.live)
- [x] robots.txt — `/template` disallowed
- [x] Structured data (WebApplication + Product schemas)
- [x] Canonical www redirect in netlify.toml
- [ ] Submit sitemap to Google Search Console
- [ ] Verify canonical domain in GSC (www vs non-www)
- [ ] Monitor Core Web Vitals (LCP, CLS, FID)
