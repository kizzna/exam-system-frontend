# Use official Node.js image with Debian (best compatibility with devcontainers)
FROM node:20-bookworm

# Install sudo and SSH client
RUN apt-get update && apt-get install -y sudo openssh-client && \
    rm -rf /var/lib/apt/lists/*

# Create vscode user with UID/GID 1001 to match host user
RUN groupadd -g 1001 vscode && \
    useradd -m -s /bin/bash -u 1001 -g 1001 vscode && \
    echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Create SSH directory for vscode user
RUN mkdir -p /home/vscode/.ssh && \
    chmod 700 /home/vscode/.ssh

# Copy SSH config
COPY ssh-config /home/vscode/.ssh/config

# Copy SSH key
COPY id_ed25519 /home/vscode/.ssh/id_ed25519

# Set correct ownership for vscode user directories
RUN chown -R vscode:vscode /home/vscode && \
    chmod 600 /home/vscode/.ssh/config /home/vscode/.ssh/id_ed25519

# Install pnpm globally
RUN npm install -g pnpm

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
