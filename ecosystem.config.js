module.exports = {
  apps: [
    {
      name: 'exam-system-frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/cephfs/exam-system/frontend/current',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://gt-omr-api-1.gt:8000',
      },
      error_file: '/cephfs/exam-system/frontend/shared/logs/error.log',
      out_file: '/cephfs/exam-system/frontend/shared/logs/out.log',
      log_file: '/cephfs/exam-system/frontend/shared/logs/combined.log',
      time: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};
