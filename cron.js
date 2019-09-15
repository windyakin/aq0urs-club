const Cron = require('cron');

require('dotenv').config();

const app = require('./app');

new Cron.CronJob({
  cronTime: process.env.CRONRANGE,
  start: true,
  onTick: async () => {
    try {
      await app();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  },
}).start();
