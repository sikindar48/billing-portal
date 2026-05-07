#!/bin/bash

echo "🗑️  InvoicePort - Cleaning up unnecessary files..."
echo ""

# Count files to be deleted
count=0

# Test files
if [ -f "browser-console-test.js" ]; then
    echo "✓ Removing: browser-console-test.js"
    rm -f browser-console-test.js
    ((count++))
fi

if [ -f "test-gmail-function.html" ]; then
    echo "✓ Removing: test-gmail-function.html"
    rm -f test-gmail-function.html
    ((count++))
fi

# Unused scripts
if [ -f "deploy-payment-functions.sh" ]; then
    echo "✓ Removing: deploy-payment-functions.sh"
    rm -f deploy-payment-functions.sh
    ((count++))
fi

# Bun lock file
if [ -f "bun.lockb" ]; then
    echo "✓ Removing: bun.lockb (using npm, not bun)"
    rm -f bun.lockb
    ((count++))
fi

# Unused source files
if [ -f "src/nav-items.jsx" ]; then
    echo "✓ Removing: src/nav-items.jsx (not imported anywhere)"
    rm -f src/nav-items.jsx
    ((count++))
fi

if [ -f "src/styles.css" ]; then
    echo "✓ Removing: src/styles.css (duplicate of index.css)"
    rm -f src/styles.css
    ((count++))
fi

# macOS files
echo "✓ Removing: .DS_Store files..."
ds_count=$(find . -name ".DS_Store" -type f | wc -l | tr -d ' ')
if [ "$ds_count" -gt 0 ]; then
    find . -name ".DS_Store" -type f -delete
    echo "  Removed $ds_count .DS_Store file(s)"
    ((count+=$ds_count))
fi

echo ""
echo "✅ Cleanup complete!"
echo "   Removed $count file(s)"
echo ""
echo "📋 Optional cleanups (run manually if needed):"
echo "   rm -rf md/        # Old documentation folder"
echo "   rm -rf dist/      # Build artifacts (regenerated on build)"
echo ""
echo "🧪 Verify everything works:"
echo "   npm run build     # Should complete without errors"
echo "   npm run dev       # Should start without errors"
