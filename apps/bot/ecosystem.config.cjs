/**
 * MeloVista Discord Bot — PM2 Production Process Configuration
 * Optimized for Linux Server (Pentium N6000, 4GB RAM)
 */
module.exports = {
  apps: [
    {
      name: 'melovista-bot',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '350M',
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 36970,
      },
    },
  ],
};
