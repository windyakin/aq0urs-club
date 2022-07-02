const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const dayjs = require('dayjs');

const log4js = require('log4js');

const News = require('./module/news');
const Talk = require('./module/talk');
const SlackService = require('./module/slack-service');

const WEBSITE_URL = Buffer.from('aHR0cHM6Ly9sb3ZlbGl2ZS1hcW91cnNjbHViLmpwLw==', 'base64').toString();
const COOKIES_PATH = `${__dirname}/cookie/data.json`;
const SCREENSHOTS_PATH = `${__dirname}/screenshot`;
const NAVIGATION_WAITING_OPTIONS = { waituntil: 'networkidle0' };

module.exports = async () => {
  const logger = log4js.getLogger();
  logger.level = 'debug';

  logger.info('Start task');

  const options = {};
  if (process.env.CHROME_EXECUTE_PATH) {
    options.executablePath = process.env.CHROME_EXECUTE_PATH;
  }
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(process.env.PUPPETEER_TIMEOUT || 30000);

  try {
    logger.debug('Load cookies...');
    if ((await fs.statAsync(COOKIES_PATH)).isFile()) {
      const cookies = await JSON.parse(await fs.readFileAsync(COOKIES_PATH, 'utf-8'));
      await Promise.each(cookies, async (cookie) => {
        await page.setCookie(cookie);
      });
    }
  } catch (err) {
    logger.info('Failed load cookies', err);
    logger.info('Don\'t worry! No problem for continuous process');
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

  try {
    logger.debug('Open the website ...');
    await page.goto(WEBSITE_URL, NAVIGATION_WAITING_OPTIONS);
  } catch (err) {
    logger.error('Failed open website', err);
    await page.close();
    await browser.close();
    throw new Error('Failed open website');
  }

  try {
    logger.debug('Try login ...');
    if (!(await page.$('.account'))) {
      await page.type('#loginId', process.env.AQ0URS_CLUB_ID);
      await page.type('#loginPass', process.env.AQ0URS_CLUB_PASS);
      // NOTE: Don't use "submit", call onClick event of login button
      await Promise.all([
        page.evaluate(() => window.ajaxLogin()),
        page.waitForNavigation(NAVIGATION_WAITING_OPTIONS),
      ]);
    } else {
      logger.debug('Already logined');
    }
  } catch (err) {
    logger.error('Failed login', err);
    await page.close();
    await browser.close();
    throw new Error('Failed login');
  }

  try {
    logger.debug('Take screenshot ...');
    await page.screenshot({ fullPage: true, path: `${SCREENSHOTS_PATH}/${dayjs().format('YYYYMMDDHHmmss')}.png` });
  } catch (err) {
    logger.error('Failed take screenshot', err);
  }

  try {
    logger.debug('Moving "News" page ...');
    await Promise.all([
      (await page.$('.news')).click(),
      page.waitForNavigation(NAVIGATION_WAITING_OPTIONS),
    ]);
  } catch (err) {
    logger.error('Failed move news page', err);
  }

  try {
    logger.debug('Get news items and post to slack ...');
    const newsItemElements = await (await page.$('.items')).$$('.items-item');
    const newsItems = await Promise.map(newsItemElements, async newsItem => new News({
      url: await newsItem.$('a') ? await newsItem.$eval('a', linkElement => linkElement.href) : null,
      dateText: (await (await (await newsItem.$('.info-date')).getProperty('innerText')).jsonValue()).trim(),
      category: (await (await (await newsItem.$('.info-category')).getProperty('innerText')).jsonValue()).trim(),
      categoryColorText: await newsItem.$eval('.info-category', categoryElement => window.getComputedStyle(categoryElement).backgroundColor),
      title: (await (await (await newsItem.$('.info-desc')).getProperty('innerText')).jsonValue()).trim(),
    }));
    const reportNewsItems = newsItems.filter((item, index) => item.isNewer() || index < 5);
    await SlackService.postMessage(`新着情報の最新${reportNewsItems.length}件です`, reportNewsItems);
  } catch (err) {
    logger.error('Failed get news items', err);
  }

  try {
    logger.debug('Moving "Radio" page ...');
    await Promise.all([
      (await page.$('.radio')).click(),
      page.waitForNavigation(NAVIGATION_WAITING_OPTIONS),
    ]);
  } catch (err) {
    logger.error('Failed move radio page', err);
  }

  try {
    logger.debug('Get radio entries and post to slack ...');
    const blogEntryElements = await (await page.$('.items')).$$('.items-item');
    const blogEntries = await Promise.map(blogEntryElements, async blogEntry => new Talk({
      dateText: (await (await (await blogEntry.$('.item-date')).getProperty('innerText')).jsonValue()).trim(),
      title: (await (await (await blogEntry.$('h2')).getProperty('innerText')).jsonValue()).trim(),
      backgroundImage: await blogEntry.$eval('figure > a', linkElement => window.getComputedStyle(linkElement).backgroundImage),
    }));
    const reportBlogEntries = blogEntries.filter((entry, index) => entry.isNewer() || index < 3);
    await SlackService.postMessage(`ラジオの最新${reportBlogEntries.length}件です`, reportBlogEntries);
  } catch (err) {
    logger.error('Failed get radio entries', err);
  }

  try {
    logger.debug('Save cookies ...');
    await fs.writeFileAsync(COOKIES_PATH, JSON.stringify(await page.cookies()));
  } catch (err) {
    logger.error('Failed save cookies', err);
  }

  await page.close();
  await browser.close();

  logger.info('Finish task');
};
