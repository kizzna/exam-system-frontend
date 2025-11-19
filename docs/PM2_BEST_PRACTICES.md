# PM2 Best Practices for Next.js Production

## Summary

**✓ Single PM2 instance per server** - Run as `www-data` with custom PM2_HOME  
**✓ Auto-start on reboot** - systemd service configured  
**✓ Isolated from user accounts** - Survives SSH disconnections

## Current Setup

```bash
User: www-data
PM2_HOME: /opt/exam-system-frontend/pm2
Auto-start: Enabled (systemd service: pm2-www-data)
Cluster Mode: 4 instances
```

## Why This Architecture?

### ❌ BAD: PM2 in user home directory

```bash
# Running as ubuntu user
PM2_HOME=/home/ubuntu/.pm2
pm2 start app.js
```

**Problems:**

- Dies when user logs out (if not daemonized properly)
- Mixed with user's personal processes
- Permission issues with web files
- Harder to manage in multi-user environments

### ✓ GOOD: PM2 in application directory

```bash
# Running as www-data (web server user)
PM2_HOME=/opt/exam-system-frontend/pm2
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 start ecosystem.config.js
```

**Benefits:**

- ✓ Clear ownership and isolation
- ✓ Survives all user sessions
- ✓ Proper file permissions (www-data owns everything)
- ✓ Easy to backup/restore (all in /opt/exam-system-frontend/)
- ✓ Systemd integration for auto-start
- ✓ Multi-server consistency

## Essential Commands

All commands must include `PM2_HOME` environment variable:

```bash
# View status
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 status

# View logs
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 logs

# Restart (zero-downtime)
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 reload exam-system-frontend

# Stop
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 stop exam-system-frontend

# Start
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 start /opt/exam-system-frontend/ecosystem.config.js

# Monitor
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 monit

# Save process list (for auto-resurrection after reboot)
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 save
```

## Helper Alias (Optional)

Add to `/home/ubuntu/.bashrc` for convenience:

```bash
alias pm2-app='sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2'
```

Then use:

```bash
pm2-app status
pm2-app logs
pm2-app reload exam-system-frontend
```

## Auto-Start Configuration

PM2 is configured to start automatically on server reboot:

```bash
# Service file
/etc/systemd/system/pm2-www-data.service

# Check service status
sudo systemctl status pm2-www-data

# Enable/disable auto-start
sudo systemctl enable pm2-www-data
sudo systemctl disable pm2-www-data

# Manual start/stop (not recommended, use pm2 commands instead)
sudo systemctl start pm2-www-data
sudo systemctl stop pm2-www-data
```

## Cluster Mode Configuration

The application runs in **cluster mode** with 4 instances:

**Advantages:**

- Load balancing across CPU cores
- Zero-downtime reloads (`pm2 reload`)
- Automatic restart on crashes
- Better resource utilization

**Configuration** (`ecosystem.config.js`):

```javascript
{
  instances: 4,           // Number of instances
  exec_mode: 'cluster',   // Cluster mode (vs fork)
  max_memory_restart: '4G', // Auto-restart if exceeds 4GB
  autorestart: true,      // Auto-restart on crash
  max_restarts: 10,       // Max consecutive restarts
  min_uptime: '10s'       // Must stay up 10s to count as successful start
}
```

## Troubleshooting

### PM2 shows "errored" but app works

**Cause:** `wait_ready` option expects app to send ready signal  
**Impact:** Cosmetic only - app actually works fine  
**Solution:** Already fixed in latest config (removed `wait_ready`)

### Can't connect to PM2 daemon

```bash
# Check if daemon is running
ps aux | grep PM2

# Kill and restart
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 kill
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 start /opt/exam-system-frontend/ecosystem.config.js
```

### App not starting after reboot

```bash
# Check systemd service
sudo systemctl status pm2-www-data

# Check PM2 dump file exists
ls -la /opt/exam-system-frontend/pm2/dump.pm2

# Save current process list
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 save
```

## Comparison: PM2 vs Other Process Managers

| Feature              | PM2        | systemd    | Docker                |
| -------------------- | ---------- | ---------- | --------------------- |
| Cluster mode         | ✓ Built-in | Manual     | Orchestrator needed   |
| Zero-downtime reload | ✓          | ✗          | ✓ (with orchestrator) |
| Logs management      | ✓ Built-in | journalctl | Docker logs           |
| Monitoring           | ✓ Built-in | Manual     | External tools        |
| Learning curve       | Low        | Medium     | High                  |
| Next.js optimized    | ✓          | ✗          | ✗                     |

**Verdict:** PM2 is the **industry standard** for Node.js/Next.js production deployments.

## Security Considerations

✓ **Run as dedicated user** (www-data, not root)  
✓ **Restrict PM2_HOME permissions** (only www-data can access)  
✓ **Separate logs from code** (/opt/exam-system-frontend/logs)  
✓ **Environment variables** in restricted .env.local (600 permissions)

## Monitoring & Logging

```bash
# Real-time logs
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 logs --lines 100

# Error logs only
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 logs --err

# Specific instance
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 logs exam-system-frontend

# Log files location
/opt/exam-system-frontend/logs/error.log
/opt/exam-system-frontend/logs/out.log
```

## Performance Tuning

```bash
# Adjust instance count based on CPU cores
# Rule of thumb: instances = CPU cores - 1 (for OS overhead)

# Check CPU cores
nproc

# Update ecosystem.config.js:
instances: 'max'  // Auto-detect optimal count
# or
instances: 3      // Manual setting
```

## Backup & Restore

```bash
# Backup PM2 configuration
sudo tar -czf pm2-backup-$(date +%Y%m%d).tar.gz /opt/exam-system-frontend/pm2/

# Restore
sudo tar -xzf pm2-backup-20251119.tar.gz -C /
sudo chown -R www-data:www-data /opt/exam-system-frontend/pm2/
sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 resurrect
```

## Related Documentation

- [PM2 Official Docs](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [/workspace/deployment/README.md](../deployment/README.md) - Full deployment guide
