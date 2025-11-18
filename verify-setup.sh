#!/bin/bash

# Project Verification Script
# Checks if all essential files exist and reports setup status

echo "==================================="
echo "Frontend Project Verification"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1 (missing)"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
    return 0
  else
    echo -e "${RED}✗${NC} $1/ (missing)"
    return 1
  fi
}

# Counter
missing=0

echo "Configuration Files:"
check_file "package.json" || ((missing++))
check_file "tsconfig.json" || ((missing++))
check_file "next.config.mjs" || ((missing++))
check_file "tailwind.config.ts" || ((missing++))
check_file ".eslintrc.json" || ((missing++))
check_file ".prettierrc" || ((missing++))
check_file "middleware.ts" || ((missing++))
echo ""

echo "Dev Container:"
check_file ".devcontainer/devcontainer.json" || ((missing++))
check_file ".devcontainer/Dockerfile" || ((missing++))
check_file ".devcontainer/docker-compose.yml" || ((missing++))
echo ""

echo "App Structure:"
check_dir "app/(auth)" || ((missing++))
check_dir "app/(dashboard)" || ((missing++))
check_file "app/layout.tsx" || ((missing++))
check_file "app/page.tsx" || ((missing++))
check_file "app/globals.css" || ((missing++))
echo ""

echo "Core Libraries:"
check_dir "lib/api" || ((missing++))
check_dir "lib/stores" || ((missing++))
check_dir "lib/types" || ((missing++))
check_dir "lib/providers" || ((missing++))
check_dir "lib/utils" || ((missing++))
echo ""

echo "Components:"
check_dir "components/ui" || ((missing++))
echo ""

echo "Testing:"
check_file "vitest.config.ts" || ((missing++))
check_file "playwright.config.ts" || ((missing++))
check_dir "tests" || ((missing++))
echo ""

echo "Deployment:"
check_file "ecosystem.config.js" || ((missing++))
check_file "scripts/dev-sync-frontend.sh" || ((missing++))
echo ""

echo "Documentation:"
check_file "README.md" || ((missing++))
check_file "QUICKSTART.md" || ((missing++))
check_file "docs/PHASE1_IMPLEMENTATION.md" || ((missing++))
echo ""

echo "==================================="
if [ $missing -eq 0 ]; then
  echo -e "${GREEN}✓ All essential files present!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Open in VS Code"
  echo "2. Reopen in Dev Container"
  echo "3. Run: pnpm dev"
  echo "4. Visit: http://localhost:3000"
else
  echo -e "${YELLOW}⚠ $missing file(s) missing${NC}"
  echo "Please review the setup."
fi
echo "==================================="
