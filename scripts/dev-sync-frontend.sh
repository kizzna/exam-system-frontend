#!/bin/bash

# Frontend Development Sync Script
# Syncs local development files to CephFS for testing/deployment

set -e

# Configuration
LOCAL_DIR="/workspaces/omr-frontend"
CEPHFS_BASE="/cephfs/exam-system/frontend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$CEPHFS_BASE/releases/dev-$TIMESTAMP"

# Parse arguments
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run]"
      exit 1
      ;;
  esac
done

echo "=== Frontend Development Sync ==="
echo "Local Dir: $LOCAL_DIR"
echo "CephFS Base: $CEPHFS_BASE"
echo "Release Dir: $RELEASE_DIR"
echo "Dry Run: $DRY_RUN"
echo ""
echo "NOTE: Build will be done on the server, not in dev container"
echo ""

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

echo ""
echo "Code synced to: $RELEASE_DIR"
echo "Current symlink updated: $CEPHFS_BASE/current"
echo ""
echo "Next steps:"
echo "  1. Deploy to server: ./deployment/remote-deploy.sh gt-omr-web-1 --build"
echo "  2. Or if already deployed, reload app: ssh gt-omr-web-1 'pm2 reload exam-system-frontend'"
echo ""