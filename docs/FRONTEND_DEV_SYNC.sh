#!/bin/bash
# Frontend development sync script - syncs Next.js code to CephFS
# Usage: ./dev-sync-frontend.sh [--dry-run] [--build]

set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Auto-detect environment and set paths
if [ -d "/workspaces/exam-system-frontend" ] && [ -d "/mnt/cephfs/exam-system" ]; then
    # Running in dev container with CephFS bind-mounted (✓ RECOMMENDED)
    DEV_ROOT="/workspaces/exam-system-frontend"
    CEPHFS_ROOT="/mnt/cephfs/exam-system/frontend"
    echo "Environment: Dev Container (CephFS bind-mounted) ✓"
elif [ -d "/workspaces/exam-system-frontend" ]; then
    # Running in dev container but CephFS not available
    echo "Error: CephFS not accessible in dev container"
    echo "Expected mount at: /mnt/cephfs/exam-system"
    echo ""
    echo "Add this to .devcontainer/devcontainer.json:"
    echo '  "mounts": ['
    echo '    "source=/mnt/cephfs/exam-system,target=/mnt/cephfs/exam-system,type=bind"'
    echo '  ]'
    exit 1
elif [ -d "/home/kris/exam-system-frontend" ]; then
    # Running on VM host
    DEV_ROOT="/home/kris/exam-system-frontend"
    CEPHFS_ROOT="/mnt/cephfs/exam-system/frontend"
    echo "Environment: VM Host"
else
    echo "Error: Cannot determine environment"
    echo "Expected: /workspaces/exam-system-frontend or /home/kris/exam-system-frontend"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
DRY_RUN=""
BUILD_BEFORE_SYNC=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN="--dry-run"
            echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
            shift
            ;;
        --build)
            BUILD_BEFORE_SYNC=true
            echo -e "${BLUE}BUILD MODE - Will build Next.js before sync${NC}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--build]"
            exit 1
            ;;
    esac
done

echo "=== OMR Frontend Sync ==="
echo "Source: $DEV_ROOT"
echo "Target: $CEPHFS_ROOT"
echo ""

# Verify source exists
if [ ! -d "$DEV_ROOT" ]; then
    echo -e "${RED}Error: Source directory not found: $DEV_ROOT${NC}"
    exit 1
fi

# Verify CephFS is mounted
if ! mountpoint -q "/mnt/cephfs" 2>/dev/null && [ ! -d "/mnt/cephfs/exam-system" ]; then
    echo -e "${RED}Error: CephFS not accessible${NC}"
    echo "Path /mnt/cephfs/exam-system not found or not accessible"
    exit 1
fi

# Build Next.js if requested
if [ "$BUILD_BEFORE_SYNC" = true ]; then
    echo ""
    echo -e "${BLUE}Building Next.js application...${NC}"
    
    cd "$DEV_ROOT"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        pnpm install
    fi
    
    # Build for production
    echo "Running production build..."
    NODE_ENV=production pnpm build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Build failed! Aborting sync.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Build successful${NC}"
fi

# Create release directory structure
RELEASE_DIR="$CEPHFS_ROOT/releases/dev-$TIMESTAMP"
echo ""
echo "Creating release directory: $RELEASE_DIR"

if [ -z "$DRY_RUN" ]; then
    mkdir -p "$RELEASE_DIR"
    mkdir -p "$CEPHFS_ROOT/shared/uploads"
    mkdir -p "$CEPHFS_ROOT/shared/cache"
    mkdir -p "$CEPHFS_ROOT/shared/logs"
fi

# Sync code using rsync
echo ""
echo "Syncing Next.js application..."
rsync -av $DRY_RUN \
    --exclude='.git/' \
    --exclude='.next/' \
    --exclude='node_modules/' \
    --exclude='.env.local' \
    --exclude='.env.development' \
    --exclude='*.log' \
    --exclude='.vscode/' \
    --exclude='.devcontainer/' \
    --exclude='tests/' \
    --exclude='coverage/' \
    --exclude='.turbo/' \
    --exclude='dist/' \
    --exclude='build/' \
    --exclude='tmp/' \
    --exclude='.next/cache/' \
    --delete \
    "$DEV_ROOT/" "$RELEASE_DIR/"

# If build was done, sync .next build output separately
if [ "$BUILD_BEFORE_SYNC" = true ] && [ -d "$DEV_ROOT/.next" ]; then
    echo ""
    echo "Syncing .next build output..."
    rsync -av $DRY_RUN \
        --exclude='cache/' \
        --delete \
        "$DEV_ROOT/.next/" "$RELEASE_DIR/.next/"
fi

# Copy production environment file if exists
if [ -f "$DEV_ROOT/.env.production" ] && [ -z "$DRY_RUN" ]; then
    echo ""
    echo "Copying production environment variables..."
    cp "$DEV_ROOT/.env.production" "$RELEASE_DIR/.env.production"
fi

# Install production dependencies in release
if [ -z "$DRY_RUN" ]; then
    echo ""
    echo "Installing production dependencies..."
    
    cd "$RELEASE_DIR"
    
    # Use pnpm with frozen lockfile for reproducible builds
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --prod --frozen-lockfile
    else
        echo -e "${YELLOW}Warning: pnpm-lock.yaml not found, using regular install${NC}"
        pnpm install --prod
    fi
fi

# Update 'current' symlink
if [ -z "$DRY_RUN" ]; then
    echo ""
    echo "Updating 'current' symlink..."
    
    # Create symlink with path relative to CephFS root
    cd "$CEPHFS_ROOT"
    ln -sfn "releases/dev-$TIMESTAMP" current
    
    echo ""
    echo -e "${GREEN}✓ Sync complete!${NC}"
    echo ""
    echo "Current deployment:"
    ls -lah "$CEPHFS_ROOT/current" | head -10
    echo ""
    echo "Deployment info:"
    echo "  Location: $RELEASE_DIR"
    echo "  Symlink:  $CEPHFS_ROOT/current"
    echo ""
    echo "To verify on web server, run:"
    echo "  ssh gt-omr-web-1 'ls -la /cephfs/exam-system/frontend/current'"
    echo ""
    
    if [ "$BUILD_BEFORE_SYNC" = true ]; then
        echo -e "${GREEN}Next steps on gt-omr-web-1:${NC}"
        echo "  1. Restart Next.js application"
        echo "  2. Verify: curl http://localhost:3000"
    else
        echo -e "${YELLOW}Note: Build not included. To deploy with build, use --build flag${NC}"
        echo "  ./dev-sync-frontend.sh --build"
    fi
else
    echo ""
    echo -e "${YELLOW}Dry run complete. Use without --dry-run to actually sync.${NC}"
fi

# Clean up old releases (keep last 10)
if [ -z "$DRY_RUN" ]; then
    echo ""
    echo "Cleaning up old releases (keeping last 10)..."
    
    cd "$CEPHFS_ROOT/releases"
    ls -t | tail -n +11 | while read old_release; do
        echo "  Removing: $old_release"
        rm -rf "$old_release"
    done
fi

echo ""
echo -e "${GREEN}=== Sync Complete ===${NC}"
