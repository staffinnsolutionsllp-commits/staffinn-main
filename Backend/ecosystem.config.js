module.exports = {
  apps: [{
    name: 'staffinn-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'development',
      PORT: 4001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4001
    },
    error_file: '~/.pm2/logs/staffinn-backend-error.log',
    out_file: '~/.pm2/logs/staffinn-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
