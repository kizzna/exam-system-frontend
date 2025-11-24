# ============================================================================
# Dev Container for Next.js 15 + Node.js 20 LTS
# ============================================================================
# Base: Debian 12 (Bookworm) with Node.js 20 LTS
# Purpose: Development environment for exam-system-frontend
# ============================================================================

FROM node:20-bookworm

# Install system dependencies and development tools
# - sudo: Allow vscode user to run privileged commands
# - git: Version control (essential for development)
# - openssh-client: SSH access to remote servers
# - default-mysql-client: Database access
# - jq: JSON processing
# - redis-tools: Redis CLI for cache management
# - iputils-ping: Network diagnostics
# - rsync: File synchronization
# - tzdata: Timezone support
# - parallel: Parallel command execution
# - net-tools: Network utilities
# - curl, wget: HTTP clients
# - vim, nano: Text editors for quick edits
RUN apt-get update && apt-get install -y \
    sudo \
    git \
    openssh-client \
    default-mysql-client \
    jq \
    redis-tools \
    iputils-ping \
    rsync \
    tzdata \
    parallel \
    net-tools \
    curl \
    wget \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Set the timezone
ENV TZ="Asia/Bangkok"

# Create vscode user with UID/GID 1001 to match host user
RUN groupadd -g 1001 vscode && \
    useradd -m -s /bin/bash -u 1001 -g 1001 vscode && \
    echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Create SSH directory for vscode user
RUN mkdir -p /home/vscode/.ssh && \
    chmod 700 /home/vscode/.ssh

# Copy SSH config
COPY ssh-config /home/vscode/.ssh/config

# Copy .my.cnf if exists
COPY .my.cnf /home/vscode/.my.cnf

# Set correct ownership for vscode user directories
RUN chown -R vscode:vscode /home/vscode && \
    chmod 600 /home/vscode/.ssh/config 

# Install pnpm globally (latest version)
# pnpm is the package manager used for this project
# It's faster and more disk-efficient than npm
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /workspace

# Change ownership of workspace to vscode user
RUN chown vscode:vscode /workspace

# Expose Next.js dev server port
EXPOSE 3000

# Switch to vscode user
USER vscode

# Default command
CMD ["sleep", "infinity"]
