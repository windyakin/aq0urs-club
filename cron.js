const Cron = require('cron');

require('dotenv').config();

const app = require('./app');

new Cron.CronJob({
  cronTime: process.env.CRONRANGE,
  start: true,
  onTick: app,
}).start();
