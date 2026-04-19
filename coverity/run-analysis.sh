#!/bin/bash
# ============================================================
# Coverity Static Analysis - Inventory Management Module
# E-Commerce Platform - Software Testing Demo
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BE_DIR="$PROJECT_ROOT/BE"
COV_DIR="$PROJECT_ROOT/coverity"
COV_INT="$COV_DIR/cov-int"
COV_OUTPUT="$COV_DIR/cov-output"

echo "======================================================"
echo " Coverity Analysis - Inventory Management Module"
echo "======================================================"
echo ""

# ----- STEP 1: Configure Coverity for JavaScript/TypeScript -----
echo "[STEP 1] Configuring Coverity for JavaScript/TypeScript..."
cov-configure --javascript
echo "  Done."
echo ""

# ----- STEP 2: Build capture (filesystem scan, no compile needed for JS/TS) -----
echo "[STEP 2] Capturing source files..."
rm -rf "$COV_INT"
cov-build \
  --dir "$COV_INT" \
  --no-command \
  --fs-capture-search "$BE_DIR/src/services/inventory" \
  --fs-capture-search "$BE_DIR/src/controllers/inventory" \
  --fs-capture-search "$BE_DIR/src/routes/inventory" \
  --fs-capture-search "$BE_DIR/src/models/products" \
  --fs-capture-search "$BE_DIR/src/utils" \
  --fs-capture-search "$COV_DIR"
echo "  Done."
echo ""

# ----- STEP 3: Run analysis -----
echo "[STEP 3] Running static analysis..."
cov-analyze \
  --dir "$COV_INT" \
  --all \
  --enable TAINTED_DATA \
  --enable NULL_RETURNS \
  --enable FORWARD_NULL \
  --enable SWALLOWED_EXCEPTION \
  --enable CHECKED_RETURN \
  --enable RESOURCE_LEAK \
  --enable TOCTOU \
  --enable MISSING_CHECK \
  --enable UNREACHABLE \
  --enable DEAD_CODE \
  --strip-path "$BE_DIR/src"
echo "  Done."
echo ""

# ----- STEP 4: Generate HTML report -----
echo "[STEP 4] Generating HTML report..."
rm -rf "$COV_OUTPUT"
mkdir -p "$COV_OUTPUT"
cov-format-errors \
  --dir "$COV_INT" \
  --html-output "$COV_OUTPUT/inventory-defects-report"
echo "  Done."
echo ""

# ----- STEP 5: Print summary -----
echo "[STEP 5] Defect summary:"
cov-format-errors \
  --dir "$COV_INT" \
  --preview-report-v2 "$COV_OUTPUT/summary.json" 2>/dev/null || true

echo ""
echo "======================================================"
echo " Analysis complete!"
echo " HTML Report: $COV_OUTPUT/inventory-defects-report/index.html"
echo "======================================================"
