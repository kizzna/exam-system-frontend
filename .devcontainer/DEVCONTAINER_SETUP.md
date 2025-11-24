# Dev Container Setup Guide

## Overview
This dev container is configured for **Next.js 15** development with **Node.js 20 LTS** and **pnpm** package manager on Ubuntu 24.04 (Debian Bookworm base).

## Current Configuration

### Runtime Environment
- **Base Image:** `node:20-bookworm` (Debian 12)
- **Node.js Version:** 20 LTS
- **Package Manager:** pnpm (installed globally)
- **User:** `vscode` (UID/GID 1001)
- **Timezone:** Asia/Bangkok

### Installed Tools
- **Development:** Node.js 20, pnpm, npm
- **Database:** MySQL client, Redis tools
- **Utilities:** SSH client, jq, rsync, parallel, net-tools, ping
- **System:** sudo, tzdata

### VS Code Extensions
The container automatically installs:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- TypeScript (`ms-vscode.vscode-typescript-next`)
- Error Lens (`usernamehw.errorlens`)
- Code Spell Checker (`streetsidesoftware.code-spell-checker`)
- Auto Rename Tag (`formulahendry.auto-rename-tag`)
- Path IntelliSense (`christian-kohler.path-intellisense`)

### Mounted Volumes
- **Workspace:** `/workspace` (your project root)
- **CephFS:** `/cephfs/exam-system` (shared storage)
- **SSH Config:** `~/.ssh/config` (for remote access)
- **SSH Key:** `~/.ssh/id_ed25519` (for authentication)

### Port Forwarding
- **3000:** Next.js Dev Server (with notifications)
- **8000:** Backend API (silent)

## How to Use This Dev Container

### Option 1: Rebuild Container (Recommended)
If you're in VS Code:
1. Press `F1` or `Ctrl+Shift+P`
2. Type: `Dev Containers: Rebuild Container`
3. Wait for the container to build and start
4. Dependencies will auto-install via `pnpm install`

### Option 2: Reopen in Container
If you're not in the container yet:
1. Press `F1` or `Ctrl+Shift+P`
2. Type: `Dev Containers: Reopen in Container`
3. Select this workspace
4. Wait for container initialization

### Option 3: Manual Docker Build
```bash
# From the .devcontainer directory
cd /workspaces/omr-frontend/.devcontainer
docker build -t omr-frontend-dev .

# Run the container
docker run -it --rm \
  -v /workspaces/omr-frontend:/workspace \
  -p 3000:3000 \
  omr-frontend-dev
```

## Verifying Installation

Once inside the container, verify your setup:

```bash
# Check Node.js version (should be v20.x.x)
node --version

# Check npm version
npm --version

# Check pnpm version
pnpm --version

# Check installed tools
mysql --version
redis-cli --version
jq --version
```

## Post-Container Setup

After the container starts:

```bash
# Install dependencies (auto-runs via postCreateCommand)
pnpm install

# Start development server
pnpm dev

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test
```

## Troubleshooting

### Node.js Not Found
If `node` command is not found, you're likely not inside the dev container. Rebuild or reopen in container.

### Permission Issues
The container uses UID/GID 1001 for the `vscode` user. If you encounter permission issues:
```bash
sudo chown -R vscode:vscode /workspace
sudo chown -R vscode:vscode /cephfs/exam-system
```

### pnpm Install Fails
If `pnpm install` fails during `postCreateCommand`:
```bash
# Manually run install
pnpm install

# Or clear cache and retry
pnpm store prune
pnpm install
```

### CephFS Mount Issues
If `/cephfs/exam-system` is not accessible:
- Verify the mount exists on the host: `ls /mnt/cephfs/exam-system`
- Check Docker mount permissions
- Rebuild the container

## Network Configuration

The container connects to the `omr-network` Docker network to communicate with:
- Backend API at `http://gt-omr-api-1:8000`
- Other services in the exam system

## Customization

### Adding More Tools
Edit [Dockerfile](file:///workspaces/omr-frontend/.devcontainer/Dockerfile) and add to the `apt-get install` line:
```dockerfile
RUN apt-get update && apt-get install -y sudo openssh-client \
    default-mysql-client jq redis-tools iputils-ping rsync tzdata parallel net-tools \
    your-new-package-here && \
    rm -rf /var/lib/apt/lists/*
```

### Adding VS Code Extensions
Edit [devcontainer.json](file:///workspaces/omr-frontend/.devcontainer/devcontainer.json) in the `extensions` array:
```json
"extensions": [
  "dbaeumer.vscode-eslint",
  "your.extension.id"
]
```

### Changing Node.js Version
Edit [Dockerfile](file:///workspaces/omr-frontend/.devcontainer/Dockerfile) line 2:
```dockerfile
# For Node.js 18 LTS
FROM node:18-bookworm

# For Node.js 22 (latest)
FROM node:22-bookworm
```

## Files in This Directory

- **[Dockerfile](file:///workspaces/omr-frontend/.devcontainer/Dockerfile)** - Container image definition
- **[devcontainer.json](file:///workspaces/omr-frontend/.devcontainer/devcontainer.json)** - VS Code dev container config
- **[docker-compose.yml](file:///workspaces/omr-frontend/.devcontainer/docker-compose.yml)** - Docker Compose configuration
- **[ssh-config](file:///workspaces/omr-frontend/.devcontainer/ssh-config)** - SSH configuration for remote access
- **[.my.cnf](file:///workspaces/omr-frontend/.devcontainer/.my.cnf)** - MySQL client configuration

## Next Steps

1. ✅ Rebuild/reopen in dev container
2. ✅ Verify Node.js 20 is installed
3. ✅ Run `pnpm install`
4. ✅ Start development with `pnpm dev`
5. ✅ Access at http://localhost:3000

---

**Need Help?** Check the main [README.md](file:///workspaces/omr-frontend/README.md) or [LOCAL_DEV_GUIDE.md](file:///workspaces/omr-frontend/LOCAL_DEV_GUIDE.md)
