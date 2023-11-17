/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const port = process.env.APP_PORT;
const appName = process.env.APP_NAME;

module.exports = {
  apps: [
    {
      name: appName.split(' ').join('-').toLowerCase(),
      watch: ['./dist'],
      script: './dist/app.js',
      env: {
        APP_PORT: Number(port),
        NODE_ENV: process.env.NODE_ENV,
      },
      instances: 2,
      max_restarts: 20,
      combine_logs: true,
      exec_mode: 'cluster',
      max_memory_restart: '200M',
      out_file: './storage/logs/pm2.out.log',
      error_file: './storage/logs/pm2.error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
