# Node.js 20 Setup for Incus Container

## ✅ Installation Complete!

Your Incus container is now configured for Next.js 15 development with Node.js 20 LTS.

### Installed Versions
- **Node.js:** v20.19.5
- **npm:** v10.8.2
- **pnpm:** v10.23.0

### System Information
- **OS:** Ubuntu 24.04.3 LTS (Noble Numbat)
- **Container Type:** Incus (not Docker)
- **Workspace:** `/workspaces/omr-frontend`

---

## 🚀 Quick Start

### 1. Install Project Dependencies
```bash
cd /workspaces/omr-frontend
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

The development server will start at **http://localhost:3000**

### 3. Other Useful Commands
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 📦 What Was Installed

### Node.js & Package Managers
- **Node.js 20 LTS** - JavaScript runtime (via NodeSource repository)
- **npm** - Default package manager (comes with Node.js)
- **pnpm** - Fast, disk-efficient package manager (installed globally)

### Development Tools
- **git** - Version control
- **default-mysql-client** - MySQL database client
- **jq** - JSON processor
- **redis-tools** - Redis CLI
- **parallel** - GNU parallel for running commands in parallel
- **iputils-ping** - Network diagnostics
- **rsync** - File synchronization
- **net-tools** - Network utilities
- **vim, nano** - Text editors

---

## 🔧 Configuration

### pnpm Store Location
The pnpm store is configured at: `~/.pnpm-store`

This improves performance and disk usage by centralizing package storage.

### Environment Variables
Check your `.env.local` file for environment-specific configuration:
```bash
cat /workspaces/omr-frontend/.env.local
```

---

## 🛠️ Troubleshooting

### Node.js Version Check
```bash
node --version  # Should show v20.19.5
```

### pnpm Not Found
If pnpm is not found after installation:
```bash
# Reinstall pnpm globally
sudo npm install -g pnpm@latest

# Verify installation
pnpm --version
```

### Permission Issues
If you encounter permission errors:
```bash
# Fix ownership of workspace
sudo chown -R $USER:$USER /workspaces/omr-frontend

# Fix ownership of pnpm store
sudo chown -R $USER:$USER ~/.pnpm-store
```

### Clear pnpm Cache
If dependencies fail to install:
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

### Port Already in Use
If port 3000 is already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
PORT=3001 pnpm dev
```

---

## 📝 Reinstalling Node.js (If Needed)

If you need to reinstall or update Node.js in the future, use the provided script:

```bash
# Make script executable (if not already)
chmod +x /workspaces/omr-frontend/scripts/setup-nodejs-incus.sh

# Run the setup script
bash /workspaces/omr-frontend/scripts/setup-nodejs-incus.sh
```

---

## 🔄 Updating Node.js

To update to the latest Node.js 20 LTS version:

```bash
# Update package list
sudo apt-get update

# Upgrade Node.js
sudo apt-get upgrade nodejs

# Verify new version
node --version
```

---

## 📚 Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **pnpm Documentation:** https://pnpm.io/
- **Node.js Documentation:** https://nodejs.org/docs/latest-v20.x/api/

---

## 🎯 Next Steps

1. ✅ Node.js 20 installed
2. ✅ pnpm installed and configured
3. ⏳ Install project dependencies: `pnpm install`
4. ⏳ Start development server: `pnpm dev`
5. ⏳ Begin development!

---

**Note:** This setup is specifically for **Incus containers** running Ubuntu 24.04. The previous `.devcontainer` configuration (Docker-based) is not used in this environment.
