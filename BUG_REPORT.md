# Bug Report & Code Issues

## 🔴 CRITICAL BUGS

### 1. **Race Condition in InvoiceHistory Delete**

**File:** `src/pages/InvoiceHistory.jsx` (Line 73)

```javascript
setInvoices(invoices.filter((inv) => inv.id !== id));
```

**Issue:** Uses stale `invoices` state instead of functional update
**Fix:** Use `setInvoices(prev => prev.filter(inv => inv.id !== id))`

### 2. **Missing Error Handling in Conversion**

**File:** `src/pages/InvoiceHistory.jsx` (Line 305-320)
**Issue:** If `proformaInvoice.items` is null/undefined, `.map()` will crash
**Fix:** Add null check: `if (!proformaInvoice.items?.length) return;`

### 3. **Unsafe Optional Chaining in Filter**

**File:** `src/pages/InvoiceHistory.jsx` (Line 369-371)

```javascript
inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
```

**Issue:** `invoice_number` might be null, causing crash
**Fix:** Add optional chaining: `inv.invoice_number?.toLowerCase()`

### 4. **Memory Leak in Dashboard**

**File:** `src/pages/Dashboard.jsx` (Line 299-318)
**Issue:** Debounced save doesn't cleanup on unmount
**Fix:** Add cleanup in useEffect return

## 🟡 MEDIUM PRIORITY BUGS

### 5. **Inconsistent Currency Symbol**

**File:** `src/pages/Dashboard.jsx` (Line 378)

```javascript
currency_symbol: selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : '₹',
```

**Issue:** Hardcoded, doesn't support other currencies
**Fix:** Create currency map object

### 6. **No Validation on Invoice Save**

**File:** `src/pages/Dashboard.jsx` (Line 342-360)
**Issue:** Saves invoice even if required fields are empty
**Fix:** Add validation before save

### 7. **Potential Null Reference in Status Badge**

**File:** `src/pages/InvoiceHistory.jsx` (Line 127-131)
**Issue:** If invoice.status is not in statusConfig, will crash
**Fix:** Add fallback: `statusConfig[status] || statusConfig.draft`

### 8. **Missing Cleanup in OTPVerification Timer**

**File:** `src/pages/OTPVerification.jsx` (Line 49)
**Issue:** setInterval not cleared on unmount
**Fix:** Return cleanup function

### 9. **Unsafe Array Access in Templates**

**File:** `src/pages/TemplatePage.jsx` (Line 211)
**Issue:** `templates.map()` assumes templates is always array
**Fix:** Add guard: `(templates || []).map()`

## 🟢 LOW PRIORITY ISSUES

### 10. **Hardcoded Admin Emails**

**File:** `src/pages/Dashboard.jsx` (Line 106)

```javascript
const adminEmails = ["nssoftwaresolutions1@gmail.com", "admin@invoiceport.com"];
```

**Issue:** Should be in environment variables
**Fix:** Move to .env file

### 11. **Console.log Statements in Production**

**Files:** Multiple files
**Issue:** Debug logs left in production code
**Fix:** Remove or use proper logging library

### 12. **Duplicate Code in Auth Pages**

**Files:** `AuthPage.jsx` and `LandingPage.jsx`
**Issue:** Same authentication logic duplicated
**Fix:** Extract to shared hook

### 13. **Magic Numbers**

**File:** `src/pages/Dashboard.jsx` (Line 345)

```javascript
if (!isAdmin && usageStats.count >= usageStats.limit)
```

**Issue:** Limit logic scattered across files
**Fix:** Centralize in constants file

## 🐛 LOGIC BUGS

### 14. **Tax Calculation Timing Issue**

**File:** `src/pages/Dashboard.jsx` (Line 341-351)
**Issue:** Tax calculated in useEffect, but might not update before save
**Impact:** Saved invoice might have wrong tax amount
**Fix:** Calculate tax in save function, not useEffect

### 15. **Invoice Number Not Unique**

**File:** `src/utils/invoiceNumberGenerator.js`
**Issue:** Random generation doesn't check for collisions
**Impact:** Possible duplicate invoice numbers
**Fix:** Check database before returning number

### 16. **Payment Modal Amount Mismatch**

**File:** `src/pages/InvoiceHistory.jsx` (Line 201)

```javascript
const invoiceAmount = invoice.total_amount || invoice.grand_total || 0;
```

**Issue:** Falls back to 0 if both are null, allows $0 payment
**Fix:** Show error if amount is 0

### 17. **Conversion Doesn't Check Original Status**

**File:** `src/pages/InvoiceHistory.jsx` (Line 262-300)
**Issue:** Can convert already-converted invoices
**Impact:** Creates duplicate tax invoices
**Fix:** Check if `converted_from_id` exists

## ⚠️ SECURITY ISSUES

### 18. **Client-Side Admin Check**

**File:** `src/pages/Dashboard.jsx` (Line 106-120)
**Issue:** Admin status checked on client, can be bypassed
**Impact:** Users can fake admin access
**Fix:** Always verify on server with RLS policies

### 19. **No CSRF Protection**

**Issue:** All API calls lack CSRF tokens
**Impact:** Vulnerable to CSRF attacks
**Fix:** Implement CSRF tokens or use Supabase's built-in protection

### 20. **Sensitive Data in Console Logs**

**File:** `src/utils/gmailOAuthService.js` (Line 47-52)
**Issue:** Logs OAuth URLs and tokens
**Impact:** Credentials exposed in browser console
**Fix:** Remove in production

## 🔧 PERFORMANCE ISSUES

### 21. **Excessive Re-renders in Dashboard**

**File:** `src/pages/Dashboard.jsx`
**Issue:** Multiple useEffect hooks trigger on every state change
**Impact:** Slow performance, excessive API calls
**Fix:** Memoize calculations, combine useEffects

### 22. **No Pagination in InvoiceHistory**

**File:** `src/pages/InvoiceHistory.jsx` (Line 45-50)
**Issue:** Loads ALL invoices at once with `select('*')`
**Impact:** Slow for users with many invoices
**Fix:** Implement pagination or virtual scrolling

### 23. **Unoptimized Image Loading**

**File:** Template components
**Issue:** Logo images not lazy-loaded
**Impact:** Slow initial page load
**Fix:** Add lazy loading for images

## 📝 DATA INTEGRITY ISSUES

### 24. **No Transaction for Multi-Table Inserts**

**File:** `src/pages/Dashboard.jsx` (Line 406-430)
**Issue:** Invoice and items inserted separately, no rollback
**Impact:** Orphaned records if second insert fails
**Fix:** Use Supabase transactions or RPC function

### 25. **Draft Auto-Save Race Condition**

**File:** `src/pages/Dashboard.jsx` (Line 299-318)
**Issue:** Multiple saves can overlap
**Impact:** Data corruption or lost updates
**Fix:** Use debounce with abort controller

### 26. **Missing Unique Constraint**

**Issue:** No unique constraint on invoice_number
**Impact:** Duplicate invoice numbers possible
**Fix:** Add unique constraint in migration

## 🎨 UX BUGS

### 27. **No Loading State on Status Change**

**File:** `src/pages/InvoiceHistory.jsx` (Line 143-170)
**Issue:** No visual feedback during status update
**Impact:** Users click multiple times
**Fix:** Add loading spinner

### 28. **Toast Messages Not Descriptive**

**Multiple files**
**Issue:** Generic "Failed to..." messages
**Impact:** Users don't know what went wrong
**Fix:** Include specific error details

### 29. **No Confirmation on Destructive Actions**

**File:** `src/pages/InvoiceHistory.jsx` (Line 62)
**Issue:** Uses browser confirm() instead of modal
**Impact:** Poor UX, can't be styled
**Fix:** Use Dialog component

## 🚨 CRITICAL FIXES NEEDED IMMEDIATELY

### Priority 1: Fix Race Conditions

```javascript
// InvoiceHistory.jsx - Line 73
// BEFORE (BUGGY):
setInvoices(invoices.filter((inv) => inv.id !== id));

// AFTER (FIXED):
setInvoices((prev) => prev.filter((inv) => inv.id !== id));
```

### Priority 2: Add Null Checks

```javascript
// InvoiceHistory.jsx - Line 369
// BEFORE (BUGGY):
inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());

// AFTER (FIXED):
inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
```

### Priority 3: Fix Memory Leak

```javascript
// Dashboard.jsx - Line 299
// BEFORE (BUGGY):
useEffect(() => {
  const timeoutId = setTimeout(async () => { ... }, 1000);
  return () => clearTimeout(timeoutId);
}, [dependencies]);

// Missing cleanup if component unmounts during async operation
```

### Priority 4: Validate Before Save

```javascript
// Dashboard.jsx - Before line 342
const validateInvoice = () => {
  if (!billTo.name) return "Customer name is required";
  if (!billTo.email) return "Customer email is required";
  if (items.length === 0) return "At least one item is required";
  if (items.some((i) => !i.name || i.quantity <= 0)) return "Invalid items";
  return null;
};

// In handleSaveToDatabase:
const error = validateInvoice();
if (error) {
  toast.error(error);
  return;
}
```

## 📊 SUMMARY

- **Critical Bugs:** 4
- **Security Issues:** 3
- **Performance Issues:** 3
- **Data Integrity Issues:** 3
- **UX Bugs:** 3
- **Total Issues Found:** 29

## 🎯 RECOMMENDED ACTION PLAN

1. **Week 1:** Fix all critical bugs (#1-4)
2. **Week 2:** Address security issues (#18-20)
3. **Week 3:** Fix data integrity issues (#24-26)
4. **Week 4:** Improve performance (#21-23)
5. **Ongoing:** Address medium/low priority issues

## ✅ TESTING CHECKLIST

After fixes, test:

- [ ] Delete invoice with multiple invoices loaded
- [ ] Change status rapidly multiple times
- [ ] Save invoice with empty fields
- [ ] Convert proforma invoice twice
- [ ] Load page with 100+ invoices
- [ ] Unmount Dashboard while saving
- [ ] Filter invoices with null values
- [ ] Payment with $0 amount
