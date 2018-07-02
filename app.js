const puppeteer = require('puppeteer');

require('dotenv').config();

const WEBSITE_URL = Buffer.from('aHR0cHM6Ly9sb3ZlbGl2ZS1hcW91cnNjbHViLmpwLw==', 'base64').toString();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(WEBSITE_URL, { waituntil: 'networkidle0' });
  await page.type('#loginId', process.env.AQ0URS_CLUB_ID);
  await page.type('#loginPass', process.env.AQ0URS_CLUB_PASS);
  // NOTE: Don't use "submit", call onClick event of login button
  await page.evaluate(() => {
    /* eslint-disable */
    ajaxLogin();
    /* eslint-enable */
  });
  await page.close();
  await browser.close();
})();
