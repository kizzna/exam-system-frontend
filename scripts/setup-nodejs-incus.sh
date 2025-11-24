#!/bin/bash
# ============================================================================
# Node.js 20 LTS Setup Script for Incus Container (Ubuntu 24.04)
# ============================================================================
# This script installs Node.js 20 LTS, pnpm, and development dependencies
# for Next.js 15 development in an Incus container environment.
# ============================================================================

set -e  # Exit on error

echo "========================================="
echo "Node.js 20 LTS Setup for Incus Container"
echo "========================================="
echo ""

# Update package list
echo "📦 Updating package list..."
sudo apt-get update

# Install prerequisites
echo "🔧 Installing prerequisites..."
sudo apt-get install -y ca-certificates curl gnupg

# Add NodeSource repository for Node.js 20 LTS
echo "📥 Adding NodeSource repository for Node.js 20..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Update package list with new repository
echo "🔄 Updating package list with NodeSource..."
sudo apt-get update

# Install Node.js 20
echo "⬇️  Installing Node.js 20 LTS..."
sudo apt-get install -y nodejs

# Install development tools and utilities
echo "🛠️  Installing development tools..."
sudo apt-get install -y \
    git \
    build-essential \
    default-mysql-client \
    jq \
    redis-tools \
    iputils-ping \
    rsync \
    parallel \
    net-tools \
    vim \
    nano

# Install pnpm globally
echo "📦 Installing pnpm package manager..."
sudo npm install -g pnpm@latest

# Verify installations
echo ""
echo "✅ Installation complete! Verifying..."
echo ""
echo "Node.js version:"
node --version
echo ""
echo "npm version:"
npm --version
echo ""
echo "pnpm version:"
pnpm --version
echo ""

# Set pnpm store directory (optional, for better performance)
echo "⚙️  Configuring pnpm..."
pnpm config set store-dir ~/.pnpm-store

echo ""
echo "========================================="
echo "✨ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Navigate to your project: cd /workspaces/omr-frontend"
echo "2. Install dependencies: pnpm install"
echo "3. Start development: pnpm dev"
echo ""
