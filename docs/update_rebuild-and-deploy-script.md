# update rebuild-and-deploy.sh

Normal flow to deploy frontend to web server is to run rebuild-and-deploy.sh (deploys to gt-omr-web-1 by default)

There are two types of codes
1. Shared codes stored in CephFS
2. Local codes stored in local workspace /opt/exam-system-frontend
- contents of /opt/exam-system-frontend/
```
ls -l /opt/exam-system-frontend/
total 24
drwxr-xr-x 4 www-data www-data   4 Nov 18 18:22 backups
drwxr-xr-x 2 www-data www-data   2 Nov 18 18:22 cache
lrwxrwxrwx 1 www-data www-data  36 Nov 18 18:22 current -> /cephfs/exam-system/frontend/current
-rw-r--r-- 1 www-data www-data 950 Dec 20 07:20 ecosystem.config.js
drwxr-xr-x 2 www-data www-data  23 Dec 24 00:00 logs
drwxr-xr-x 5 www-data www-data  14 Nov 23 16:37 pm2
drwxr-xr-x 2 www-data www-data   4 Nov 18 18:22 scripts
drwxr-xr-x 4 www-data www-data   4 Nov 18 18:22 tmp
```
- symlink current points to latest release
```
readlink /opt/exam-system-frontend/current
/cephfs/exam-system/frontend/current
readlink /cephfs/exam-system/frontend/current
/cephfs/exam-system/frontend/releases/dev-20251224_061103
```

## This approach has problem if deployed to 3 servers
- if deployed to 3 servers, then each server will have different current symlink

## Solution
- /workspaces/omr-frontend/scripts/dev-sync-frontend.sh should run only once.
Since code is shared in CephFS, so we only need to sync code once.

## 