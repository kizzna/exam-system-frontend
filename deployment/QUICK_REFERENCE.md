# Frontend Deployment - Quick Reference

## One-Command Deployment

### First Time Setup

```bash
./deployment/remote-deploy.sh gt-omr-web-1 --build
```

### Update Code (Fast)

```bash
./deployment/remote-deploy.sh gt-omr-web-1 --skip-deps
```

### Update with Rebuild

```bash
./deployment/remote-deploy.sh gt-omr-web-1 --build
```

## Manual Deployment Steps

### From Dev Machine

```bash
# Sync code to CephFS
./scripts/dev-sync-frontend.sh --build

# Deploy to server
ssh gt-omr-web-1 "pm2 reload exam-system-frontend"
```

### On Server (First Time)

```bash
# Install dependencies
sudo /tmp/install-dependencies.sh

# Setup directories
sudo /tmp/setup-frontend-local.sh

# Configure Nginx
sudo /tmp/configure-nginx.sh

# Deploy
sudo /tmp/deploy-frontend.sh
```

## Common Commands

### Application Management

```bash
# Status
pm2 status

# Logs (real-time)
pm2 logs exam-system-frontend

# Logs (last 100 lines)
pm2 logs exam-system-frontend --lines 100

# Restart
pm2 restart exam-system-frontend

# Reload (zero-downtime)
pm2 reload exam-system-frontend

# Stop
pm2 stop exam-system-frontend

# Monitor
pm2 monit
```

### Nginx Management

```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Status
sudo systemctl status nginx

# Logs
tail -f /var/log/nginx/exam-system-frontend.access.log
tail -f /var/log/nginx/exam-system-frontend.error.log
```

### Verification

```bash
# Check app responding
curl -I http://localhost:3000

# Check Nginx proxy
curl -I http://localhost

# Check from outside
curl -I http://SERVER_IP
```

## File Locations

### Code & Configuration

```
/opt/exam-system-frontend/
├── current -> /cephfs/exam-system/frontend/current
├── .env.local
├── ecosystem.config.js
├── logs/
└── cache/

/cephfs/exam-system/frontend/
├── current -> releases/dev-TIMESTAMP
├── releases/
└── shared/
```

### Logs

```
PM2 Logs:       /opt/exam-system-frontend/logs/
Nginx Access:   /var/log/nginx/exam-system-frontend.access.log
Nginx Error:    /var/log/nginx/exam-system-frontend.error.log
```

### Configuration Files

```
Environment:    /opt/exam-system-frontend/.env.local
PM2 Config:     /opt/exam-system-frontend/ecosystem.config.js
Nginx Config:   /etc/nginx/sites-available/exam-system-frontend
```

## Troubleshooting

### App won't start

```bash
# View PM2 logs
pm2 logs exam-system-frontend --lines 200

# Check dependencies
ls /cephfs/exam-system/frontend/current/node_modules/

# Reinstall dependencies
cd /cephfs/exam-system/frontend/current
pnpm install --prod

# Manual start test
NODE_ENV=production pnpm start
```

### 502 Bad Gateway

```bash
# Check PM2 status
pm2 status

# Check port 3000
netstat -tpln | grep 3000

# Restart app
pm2 restart exam-system-frontend

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Deployment failed

```bash
# Check sync logs
cat /cephfs/exam-system/frontend/current/package.json

# Verify CephFS mount
mount | grep cephfs
ls -la /cephfs/exam-system/frontend/

# Check SSH connection
ssh gt-omr-web-1 "echo 'Connection OK'"
```

## Multiple Servers

### Deploy to All

```bash
./deployment/remote-deploy.sh gt-omr-web-1
./deployment/remote-deploy.sh gt-omr-web-2
./deployment/remote-deploy.sh gt-omr-web-3
```

### Update All

```bash
# Sync once
./scripts/dev-sync-frontend.sh

# Reload each server
ssh gt-omr-web-1 "pm2 reload exam-system-frontend"
ssh gt-omr-web-2 "pm2 reload exam-system-frontend"
ssh gt-omr-web-3 "pm2 reload exam-system-frontend"
```

## Rollback

```bash
# On server: List releases
ls -la /cephfs/exam-system/frontend/releases/

# Change symlink to previous release
sudo ln -sfn /cephfs/exam-system/frontend/releases/PREVIOUS_RELEASE \
             /cephfs/exam-system/frontend/current

# Reload app
pm2 reload exam-system-frontend
```

## Performance Tuning

### Increase PM2 Instances

Edit `/opt/exam-system-frontend/ecosystem.config.js`:

```javascript
instances: 8,  // or 'max'
```

Then: `pm2 reload exam-system-frontend`

### Increase Memory Limit

Edit `/opt/exam-system-frontend/.env.local`:

```env
NODE_OPTIONS=--max-old-space-size=8192
```

Then: `pm2 restart exam-system-frontend`

### Clear Cache

```bash
rm -rf /opt/exam-system-frontend/cache/*
rm -rf /var/cache/nginx/static/*
sudo systemctl reload nginx
```

## Access URLs

```
Development:    http://localhost:3000
Direct (port):  http://SERVER_IP:3000
Via Nginx:      http://SERVER_IP
```

## Key Environment Variables

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=http://gt-omr-api-1:8000
SERVER_ID=gt-omr-web-1
NODE_OPTIONS=--max-old-space-size=4096
```

## Support Resources

- Full Guide: `/workspace/deployment/README.md`
- Checklist: `/workspace/deployment/DEPLOYMENT_CHECKLIST.md`
- Scripts: `/workspace/deployment/*.sh`
- PM2 Docs: https://pm2.keymetrics.io/docs/
- Nginx Docs: https://nginx.org/en/docs/
