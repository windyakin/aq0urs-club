const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const moment = require('moment');

require('dotenv').config();

const WEBSITE_URL = Buffer.from('aHR0cHM6Ly9sb3ZlbGl2ZS1hcW91cnNjbHViLmpwLw==', 'base64').toString();
const COOKIES_PATH = `${__dirname}/cookie/data.json`;
const SCREENSHOTS_PATH = `${__dirname}/screenshots`;

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

  page.emulate({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false,
    },
  });

  await page.goto(WEBSITE_URL, { waituntil: 'networkidle0' });

  try {
    if (!(await page.$('.account'))) {
      await page.type('#loginId', process.env.AQ0URS_CLUB_ID);
      await page.type('#loginPass', process.env.AQ0URS_CLUB_PASS);
      // NOTE: Don't use "submit", call onClick event of login button
      await Promise.all([
        page.evaluate(() => {
          /* eslint-disable */
          ajaxLogin();
          /* eslint-enable */
        }),
        page.waitForNavigation({ waituntil: 'networkidle0' }),
      ]);
    }
  } catch (err) {
    console.error('Failed login', err);
    await page.close();
    await browser.close();
    process.exit(1);
  }

  try {
    await page.screenshot({ fullPage: true, path: `${SCREENSHOTS_PATH}/${moment().format('YYYYMMDDHHmmss')}.png` });
  } catch (err) {
    console.error('Failed take screenshot', err);
  }

  await fs.writeFileAsync(COOKIES_PATH, JSON.stringify(await page.cookies()));
  await page.close();
  await browser.close();
})();
