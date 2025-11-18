#!/bin/bash

# Frontend Development Sync Script
# Syncs local development files to CephFS for testing/deployment

set -e

# Configuration
LOCAL_DIR="/home/kris/exam-system-frontend"
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
RSYNC_CMD="rsync -avz --progress"
RSYNC_CMD="$RSYNC_CMD --exclude=node_modules"
RSYNC_CMD="$RSYNC_CMD --exclude=.git"
RSYNC_CMD="$RSYNC_CMD --exclude=.next"
RSYNC_CMD="$RSYNC_CMD --exclude=.env.local"
RSYNC_CMD="$RSYNC_CMD --exclude=tests"
RSYNC_CMD="$RSYNC_CMD --exclude=playwright-report"

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

# Update symlink to current
if [ "$DRY_RUN" = false ]; then
  ln -sfn "$RELEASE_DIR" "$CEPHFS_BASE/current"
  echo "✓ Updated current symlink"
fi

echo ""
echo "=== Sync Complete ==="
echo "To deploy:"
echo "  ssh gt-omr-web-1"
echo "  pm2 restart exam-system-frontend"
echo ""
