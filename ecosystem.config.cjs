/**
 * PM2 ecosystem file for AapKaPlot on the VPS.
 * Runs alongside the existing `vidyt` process — uses port 3001 so there's
 * no collision with vidyt (port 3000).
 *
 * Commands:
 *   pm2 start ecosystem.config.cjs
 *   pm2 startOrReload ecosystem.config.cjs --update-env
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "aapkaplot",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: "/var/www/aapkaplot",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "768M",
      restart_delay: 3000,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        HOSTNAME: "127.0.0.1",
        NEXT_PUBLIC_SITE_URL: "https://8rupiya.in",
        // Secret values live in .env.local on the VPS (gitignored).
        // PM2 reads them via Next.js' built-in env loader on cold start.
      },
      out_file: "/var/log/aapkaplot/out.log",
      error_file: "/var/log/aapkaplot/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
