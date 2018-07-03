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

  try {
    await Promise.all([
      (await page.$('.news')).click(),
      page.waitForNavigation({ waituntil: 'networkidle0' }),
    ]);
  } catch (err) {
    console.error('Failed move news page', err);
  }

  try {
    const newsItemElements = await (await page.$('.items')).$$('.items-item');
    await Promise.each(newsItemElements, async (newsItem) => {
      const newsDateText = (await (await (await newsItem.$('.info-date')).getProperty('innerText')).jsonValue()).trim();
      const newsCategory = (await (await (await newsItem.$('.info-category')).getProperty('innerText')).jsonValue()).trim();
      // eslint-disable-next-line no-undef
      const newsCategoryColor = await newsItem.$eval('.info-category', categoryElement => getComputedStyle(categoryElement).backgroundColor);
      const newsTitle = (await (await (await newsItem.$('.info-desc')).getProperty('innerText')).jsonValue()).trim();
      console.log(newsDateText, newsCategory, newsCategoryColor, newsTitle);
    });
  } catch (err) {
    console.error('Failed get news items', err);
  }

  try {
    await Promise.all([
      (await page.$('.blog')).click(),
      page.waitForNavigation({ waituntil: 'networkidle0' }),
    ]);
  } catch (err) {
    console.error('Failed move news page', err);
  }

  try {
    const blogEntries = await (await page.$('.items')).$$('.items-item');
    await Promise.each(blogEntries, async (blogEntry) => {
      const entryDateText = (await (await (await blogEntry.$('.info-date')).getProperty('innerText')).jsonValue()).trim();
      const entryAuthor = (await (await (await blogEntry.$('.items-info-detail > a')).getProperty('innerText')).jsonValue()).trim();
      // eslint-disable-next-line no-undef
      const entryAuthorColor = await blogEntry.$eval('.items-info-detail > a', authorElement => getComputedStyle(authorElement).backgroundColor);
      const entryTitle = (await (await (await blogEntry.$('h2')).getProperty('innerText')).jsonValue()).trim();
      const entrySummary = (await (await (await blogEntry.$('.items-summary')).getProperty('innerText')).jsonValue()).trim();
      console.log(entryDateText, entryAuthor, entryAuthorColor, entryTitle, entrySummary);
    });
  } catch (err) {
    console.error('Failed get blog entries', err);
  }

  await fs.writeFileAsync(COOKIES_PATH, JSON.stringify(await page.cookies()));
  await page.close();
  await browser.close();
})();
