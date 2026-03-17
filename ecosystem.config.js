/**
 * PM2 ecosystem config for Veridex
 * Usage:
 *   pm2 start ecosystem.config.js        # start everything
 *   pm2 restart ecosystem.config.js      # restart all
 *   pm2 save && pm2 startup              # persist across reboots
 *   pm2 logs veridex                     # tail orchestrator logs
 */

module.exports = {
  apps: [
    {
      name: "veridex",
      script: "orchestrator/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/veridex-error.log",
      out_file:   "logs/veridex-out.log",
      merge_logs: true,
    },
    {
      name: "research-bot",
      script: "bots/research-bot.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        VERIDEX_API: "http://localhost:3001",
      },
      error_file: "logs/research-bot-error.log",
      out_file:   "logs/research-bot-out.log",
    },
    {
      name: "trading-bot",
      script: "bots/trading-bot.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        VERIDEX_API: "http://localhost:3001",
      },
      error_file: "logs/trading-bot-error.log",
      out_file:   "logs/trading-bot-out.log",
    },
    {
      name: "rogue-bot",
      script: "bots/rogue-bot.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        VERIDEX_API: "http://localhost:3001",
      },
      error_file: "logs/rogue-bot-error.log",
      out_file:   "logs/rogue-bot-out.log",
    },
    {
      name: "data-bot",
      script: "bots/data-bot.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        VERIDEX_API: "http://localhost:3001",
      },
      error_file: "logs/data-bot-error.log",
      out_file:   "logs/data-bot-out.log",
    },
    {
      name: "api-bot",
      script: "bots/api-bot.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        VERIDEX_API: "http://localhost:3001",
      },
      error_file: "logs/api-bot-error.log",
      out_file:   "logs/api-bot-out.log",
    },
    {
      name: "veridex-frontend",
      script: "npm",
      args: "run start",
      cwd: `${__dirname}/app`,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "logs/frontend-error.log",
      out_file:   "logs/frontend-out.log",
    },
  ],
};
