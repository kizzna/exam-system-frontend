#!/bin/bash

# Frontend Development Sync Script
# Syncs local development files to CephFS for testing/deployment

set -e

# Configuration
LOCAL_DIR="/workspace"
CEPHFS_BASE="/cephfs/exam-system/frontend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$CEPHFS_BASE/releases/dev-$TIMESTAMP"

# Parse arguments
DRY_RUN=false
BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --build)
      BUILD=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run] [--build]"
      exit 1
      ;;
  esac
done

echo "=== Frontend Development Sync ==="
echo "Local Dir: $LOCAL_DIR"
echo "CephFS Base: $CEPHFS_BASE"
echo "Release Dir: $RELEASE_DIR"
echo "Dry Run: $DRY_RUN"
echo "Build: $BUILD"
echo ""

# Build if requested
if [ "$BUILD" = true ]; then
  echo "Building Next.js application..."
  cd "$LOCAL_DIR"
  pnpm build
  echo "✓ Build complete"
  echo ""
fi

# Prepare rsync command
RSYNC_CMD="rsync -av --progress"
RSYNC_CMD="$RSYNC_CMD --exclude=node_modules"
RSYNC_CMD="$RSYNC_CMD --exclude=.git"
RSYNC_CMD="$RSYNC_CMD --exclude=.next"
RSYNC_CMD="$RSYNC_CMD --exclude=.env.local"
RSYNC_CMD="$RSYNC_CMD --exclude=tests"
RSYNC_CMD="$RSYNC_CMD --exclude=playwright-report"
# exclude pnpm store directory if it exists
RSYNC_CMD="$RSYNC_CMD --exclude=.pnpm-store"

if [ "$DRY_RUN" = true ]; then
  RSYNC_CMD="$RSYNC_CMD --dry-run"
fi

# Create release directory
if [ "$DRY_RUN" = false ]; then
  mkdir -p "$RELEASE_DIR"
  echo "✓ Created release directory: $RELEASE_DIR"
fi

# Sync files
echo "Syncing files..."
$RSYNC_CMD "$LOCAL_DIR/" "$RELEASE_DIR/"
#echo "Syncing files in parallel..."
#cd "$LOCAL_DIR"
#ls -A | parallel -j8 rsync -av --progress --relative {} "$RELEASE_DIR/"

# Update symlink to current
if [ "$DRY_RUN" = false ]; then
  ln -sfn "$RELEASE_DIR" "$CEPHFS_BASE/current"
  echo "✓ Updated current symlink"
fi

echo ""
echo "=== Sync Complete ==="

# Install dependencies on server if not in dry-run mode
if [ "$DRY_RUN" = false ]; then
  echo ""
  echo "Installing production dependencies on server..."
  
  if ssh gt-omr-web-1 "cd /cephfs/exam-system/frontend/current && pnpm install --prod --frozen-lockfile" 2>/dev/null; then
    echo "✓ Dependencies installed successfully"
  else
    echo "⚠ Warning: Could not install dependencies on server"
    echo "Please run manually:"
    echo "  ssh gt-omr-web-1 'cd /cephfs/exam-system/frontend/current && pnpm install --prod'"
  fi
fi

echo ""
echo "To deploy/restart application:"
echo "  ssh gt-omr-web-1 'pm2 reload exam-system-frontend'"
echo ""
echo "Or use the automated deployment:"
echo "  ./deployment/remote-deploy.sh gt-omr-web-1"
echo ""