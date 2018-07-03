const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

require('dotenv').config();

const WEBSITE_URL = Buffer.from('aHR0cHM6Ly9sb3ZlbGl2ZS1hcW91cnNjbHViLmpwLw==', 'base64').toString();
const COOKIES_PATH = `${__dirname}/cookie/data.json`;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    if ((await fs.statAsync(COOKIES_PATH)).isFile()) {
      const cookies = await JSON.parse(await fs.readFileAsync(COOKIES_PATH, 'utf-8'));
      await Promise.each(cookies, async (cookie) => {
        await page.setCookie(cookie);
      });
    }
  } catch (err) {
    console.error('Failed load cookies', err);
  }

  await page.goto(WEBSITE_URL, { waituntil: 'networkidle0' });

  if (!(await page.$('.account'))) {
    await page.type('#loginId', process.env.AQ0URS_CLUB_ID);
    await page.type('#loginPass', process.env.AQ0URS_CLUB_PASS);
    // NOTE: Don't use "submit", call onClick event of login button
    await await Promise.all([
      page.evaluate(() => {
        /* eslint-disable */
        ajaxLogin();
        /* eslint-enable */
      }),
      page.waitForNavigation({ waituntil: 'networkidle0' }),
    ]);
  }

  await fs.writeFileAsync(COOKIES_PATH, JSON.stringify(await page.cookies()));
  await page.close();
  await browser.close();
})();
