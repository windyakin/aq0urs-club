const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const moment = require('moment');

const Cron = require('cron');

const News = require('./module/news');
const Blog = require('./module/blog');
const SlackService = require('./module/slack-service');

require('dotenv').config();

const WEBSITE_URL = Buffer.from('aHR0cHM6Ly9sb3ZlbGl2ZS1hcW91cnNjbHViLmpwLw==', 'base64').toString();
const COOKIES_PATH = `${__dirname}/cookie/data.json`;
const SCREENSHOTS_PATH = `${__dirname}/screenshot`;
const NAVIGATION_WAITING_OPTIONS = { waituntil: 'networkidle0' };

new Cron.CronJob({
  cronTime: process.env.CRONRANGE,
  start: false,
  onTick: async () => {
    const options = {};
    if (process.env.CHROME_EXECUTE_PATH) {
      options.executablePath = process.env.CHROME_EXECUTE_PATH;
    }
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(process.env.PUPPETEER_TIMEOUT || 30000);

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

    await page.goto(WEBSITE_URL, NAVIGATION_WAITING_OPTIONS);

    try {
      if (!(await page.$('.account'))) {
        await page.type('#loginId', process.env.AQ0URS_CLUB_ID);
        await page.type('#loginPass', process.env.AQ0URS_CLUB_PASS);
        // NOTE: Don't use "submit", call onClick event of login button
        await Promise.all([
          page.evaluate(() => window.ajaxLogin()),
          page.waitForNavigation(NAVIGATION_WAITING_OPTIONS),
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
        page.waitForNavigation(NAVIGATION_WAITING_OPTIONS),
      ]);
    } catch (err) {
      console.error('Failed move news page', err);
    }

    try {
      const newsItemElements = await (await page.$('.items')).$$('.items-item');
      const newsItems = await Promise.map(newsItemElements, async (newsItem) => {
        const newsUrl = await newsItem.$('a') ? await newsItem.$eval('a', linkElement => linkElement.href) : null;
        const newsDateText = (await (await (await newsItem.$('.info-date')).getProperty('innerText')).jsonValue()).trim();
        const newsCategory = (await (await (await newsItem.$('.info-category')).getProperty('innerText')).jsonValue()).trim();
        const newsCategoryColor = await newsItem.$eval('.info-category', categoryElement => window.getComputedStyle(categoryElement).backgroundColor);
        const newsTitle = (await (await (await newsItem.$('.info-desc')).getProperty('innerText')).jsonValue()).trim();
        return new News(
          newsUrl, newsDateText, newsCategory, newsCategoryColor, newsTitle,
        );
      });
      await SlackService.postMessage('新着情報の最新5件です', newsItems.slice(0, 5));
    } catch (err) {
      console.error('Failed get news items', err);
    }

    try {
      await Promise.all([
        (await page.$('.blog')).click(),
        page.waitForNavigation(NAVIGATION_WAITING_OPTIONS),
      ]);
    } catch (err) {
      console.error('Failed move news page', err);
    }

    try {
      const blogEntryElements = await (await page.$('.items')).$$('.items-item');
      const blogEntries = await Promise.map(blogEntryElements, async (blogEntry) => {
        const entryUrl = await blogEntry.$eval('h2 > a', linkElement => linkElement.href);
        const entryDateText = (await (await (await blogEntry.$('.info-date')).getProperty('innerText')).jsonValue()).trim();
        const entryAuthor = (await (await (await blogEntry.$('.items-info-detail > a')).getProperty('innerText')).jsonValue()).trim();
        const entryAuthorColor = await blogEntry.$eval('.items-info-detail > a', authorElement => window.getComputedStyle(authorElement).backgroundColor);
        const entryTitle = (await (await (await blogEntry.$('h2')).getProperty('innerText')).jsonValue()).trim();
        const entrySummary = (await (await (await blogEntry.$('.items-summary')).getProperty('innerText')).jsonValue()).trim();
        return new Blog(
          entryUrl, entryDateText, entryAuthor, entryAuthorColor, entryTitle, entrySummary,
        );
      });
      await SlackService.postMessage('ブログ記事の最新3件です', blogEntries.slice(0, 3));
    } catch (err) {
      console.error('Failed get blog entries', err);
    }

    try {
      await fs.writeFileAsync(COOKIES_PATH, JSON.stringify(await page.cookies()));
    } catch (err) {
      console.error('Failed save cookies', err);
    }

    await page.close();
    await browser.close();
  },
}).start();
