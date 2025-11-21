#!/bin/bash
# Local Development Setup Script
# Sets up the dev container for local Next.js development

set -e

echo "🚀 Setting up local development environment..."
echo ""

# Check if we're in dev container
if [ ! -f "/.dockerenv" ]; then
  echo "⚠️  Warning: Not running in dev container"
  echo "   This script is designed for the dev container environment"
  echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
else
  echo "✓ Dependencies already installed"
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
  echo "📝 Creating .env.local..."
  cat > .env.local << 'EOF'
# API Configuration - Point to production API servers
NEXT_PUBLIC_API_URL=http://gt-omr-api-1.gt:8000

# Development
NEXT_PUBLIC_ENABLE_DEBUG=true

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-change-in-production
EOF
  echo "✓ Created .env.local"
else
  echo "✓ .env.local already exists"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║     Local Development Environment Ready!             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Start development server:"
echo "  pnpm dev"
echo ""
echo "Access application:"
echo "  http://localhost:3000"
echo ""
echo "Features:"
echo "  ✓ Hot reload on file changes"
echo "  ✓ Instant TypeScript error checking"
echo "  ✓ Fast iteration (< 1 second)"
echo "  ✓ Uses production API (gt-omr-api-1)"
echo ""
echo "Build for production:"
echo "  pnpm build"
echo ""
echo "Deploy to production servers:"
echo "  ./scripts/rebuild-and-deploy.sh gt-omr-web-1"
echo "  (Only when phase is complete and tested locally)"
echo ""
