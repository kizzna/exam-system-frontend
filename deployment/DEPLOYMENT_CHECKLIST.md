# Frontend Deployment Checklist

Use this checklist to ensure successful deployment of the OMR Exam System Frontend.

## Pre-Deployment Checklist

### Development Environment

- [ ] All changes committed to git
- [ ] Code passes linting: `pnpm lint`
- [ ] TypeScript compilation successful: `pnpm type-check`
- [ ] Tests passing: `pnpm test`
- [ ] Production build successful: `pnpm build`

### Infrastructure

- [ ] CephFS is mounted and accessible at `/cephfs`
- [ ] Backend API is running and accessible (gt-omr-api-1:8000)
- [ ] Passwordless SSH configured to target server
- [ ] Server meets minimum requirements:
  - [ ] Ubuntu 24.04
  - [ ] 4GB RAM minimum
  - [ ] 20GB disk space available
  - [ ] Network connectivity to CephFS and API server

### Configuration

- [ ] API URL configured correctly in `.env.local`
- [ ] Server-specific settings reviewed
- [ ] PM2 cluster instance count appropriate for server specs
- [ ] Nginx server name configured (if using domain)

## First-Time Deployment Checklist

### Step 1: Prepare Development Environment

- [ ] Navigate to deployment directory: `cd /workspace/deployment`
- [ ] Verify all deployment scripts are executable: `ls -la *.sh`
- [ ] Review configuration in scripts if needed

### Step 2: Run Remote Deployment

- [ ] Execute: `./remote-deploy.sh gt-omr-web-1 --build`
- [ ] Monitor output for errors
- [ ] Verify each step completes successfully:
  - [ ] SSH connection verified
  - [ ] Deployment scripts transferred
  - [ ] Code synced to CephFS
  - [ ] Dependencies installed (Node.js, pnpm, PM2, Nginx)
  - [ ] Directory structure created
  - [ ] Node.js dependencies installed
  - [ ] Environment configured
  - [ ] Nginx configured
  - [ ] Application started with PM2

### Step 3: Verify Deployment

- [ ] PM2 status shows application as "online"
- [ ] Application responds on port 3000: `ssh gt-omr-web-1 "curl -I http://localhost:3000"`
- [ ] Nginx proxy working: `curl -I http://SERVER_IP`
- [ ] No errors in PM2 logs: `ssh gt-omr-web-1 "pm2 logs exam-system-frontend --lines 50"`
- [ ] No errors in Nginx logs: `ssh gt-omr-web-1 "tail -50 /var/log/nginx/exam-system-frontend.error.log"`

### Step 4: Functional Testing

- [ ] Access application via browser: `http://SERVER_IP`
- [ ] Login page loads correctly
- [ ] Can authenticate with test credentials
- [ ] Static assets loading (images, CSS, JS)
- [ ] API requests working (check browser DevTools Network tab)
- [ ] No console errors in browser

### Step 5: Performance Verification

- [ ] All PM2 cluster instances running: `ssh gt-omr-web-1 "pm2 status"`
- [ ] CPU usage reasonable: `ssh gt-omr-web-1 "pm2 monit"`
- [ ] Memory usage within limits
- [ ] Response time acceptable (<500ms for initial load)

### Step 6: Post-Deployment Setup

- [ ] PM2 startup configured: `ssh gt-omr-web-1 "pm2 save"`
- [ ] Cron jobs configured (optional):
  - [ ] Config backup: `0 2 * * * /opt/exam-system-frontend/scripts/backup-local-config.sh`
  - [ ] Cache cleanup: `0 3 * * * /opt/exam-system-frontend/scripts/cleanup-cache.sh`
- [ ] Logrotate configured for application logs
- [ ] Firewall rules configured if applicable
- [ ] Monitoring set up (if applicable)

## Subsequent Deployment Checklist

### Step 1: Code Update

- [ ] Make code changes
- [ ] Test locally: `pnpm dev`
- [ ] Build succeeds: `pnpm build`
- [ ] Commit changes

### Step 2: Sync and Deploy

- [ ] Sync code: `./deployment/remote-deploy.sh gt-omr-web-1`
- [ ] Or with build: `./deployment/remote-deploy.sh gt-omr-web-1 --build`
- [ ] Monitor deployment output

### Step 3: Verify Update

- [ ] Application reloaded successfully
- [ ] No downtime (PM2 reload is zero-downtime)
- [ ] New code changes visible
- [ ] No new errors in logs

## Multi-Server Deployment Checklist

### Server 1 (gt-omr-web-1)

- [ ] Deploy to first server: `./remote-deploy.sh gt-omr-web-1 --build`
- [ ] Verify deployment
- [ ] Confirm stability (run for 5-10 minutes)

### Server 2 (gt-omr-web-2)

- [ ] Deploy to second server: `./remote-deploy.sh gt-omr-web-2`
- [ ] Verify deployment
- [ ] Confirm both servers operational

### Server 3 (gt-omr-web-3)

- [ ] Deploy to third server: `./remote-deploy.sh gt-omr-web-3`
- [ ] Verify deployment
- [ ] Confirm all three servers operational

### Load Balancer (if applicable)

- [ ] Configure load balancer with all server IPs
- [ ] Test load distribution
- [ ] Verify failover behavior

## Rollback Checklist

If deployment fails or issues are discovered:

### Quick Rollback

- [ ] Identify previous working release in `/cephfs/exam-system/frontend/releases/`
- [ ] Update symlink:
  ```bash
  ssh gt-omr-web-1 "sudo ln -sfn /cephfs/exam-system/frontend/releases/PREVIOUS_RELEASE /cephfs/exam-system/frontend/current"
  ```
- [ ] Reload PM2: `ssh gt-omr-web-1 "pm2 reload exam-system-frontend"`
- [ ] Verify application working

### Full Rollback

- [ ] Restore from git: Check out previous commit
- [ ] Run deployment with previous code
- [ ] Verify stability

## Troubleshooting Guide

### Issue: Application Won't Start

- [ ] Check PM2 logs: `pm2 logs exam-system-frontend`
- [ ] Verify dependencies installed: `ls /cephfs/exam-system/frontend/current/node_modules/`
- [ ] Check environment file: `cat /opt/exam-system-frontend/.env.local`
- [ ] Try manual start: `cd /cephfs/exam-system/frontend/current && NODE_ENV=production pnpm start`

### Issue: Nginx 502 Bad Gateway

- [ ] Verify application running: `pm2 status`
- [ ] Check port 3000 listening: `netstat -tpln | grep 3000`
- [ ] Review Nginx config: `nginx -t`
- [ ] Check Nginx error log: `tail -f /var/log/nginx/exam-system-frontend.error.log`

### Issue: Slow Performance

- [ ] Check PM2 cluster instances: `pm2 status`
- [ ] Review resource usage: `pm2 monit`
- [ ] Check system resources: `htop`
- [ ] Review Nginx cache hit rate
- [ ] Consider increasing PM2 instances or memory limits

### Issue: CephFS Connection Problems

- [ ] Verify mount: `mount | grep cephfs`
- [ ] Check connectivity to CephFS server
- [ ] Review CephFS logs
- [ ] Test read/write access: `ls -la /cephfs/exam-system/frontend/`

## Sign-Off

### Deployment Lead

- [ ] All checklist items completed
- [ ] Application verified working
- [ ] No critical errors in logs
- [ ] Performance acceptable

**Name:** ********\_********  
**Date:** ********\_********  
**Signature:** ********\_********

### Stakeholder Approval

- [ ] Application functionality verified
- [ ] User acceptance testing passed
- [ ] Ready for production use

**Name:** ********\_********  
**Date:** ********\_********  
**Signature:** ********\_********

## Notes

Use this section to document any deployment-specific issues, workarounds, or important observations:

```
Deployment Date: _______________
Server(s): _______________
Release Version: _______________

Notes:







```
