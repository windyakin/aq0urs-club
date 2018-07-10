const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const minio = require('minio');
const moment = require('moment');

require('dotenv').config();

const SCREENSHOTS_PATH = `${__dirname}/screenshot`;

(async () => {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  await page.goto('http://sugoi.windyakin.net', { waitUntil: 'networkidle0' });

  const imageDataURL = await page.$eval('.special', async (imageElement) => {
    const image = document.createElement('img');
    image.src = window.getComputedStyle(imageElement).backgroundImage.split('"')[1];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    console.log(canvas);

    await new Promise((resolve) => {
      if (image.complete || image.width > 0) resolve();
      image.addEventListener('load', () => resolve());
    });

    context.drawImage(image, 0, 0);

    return canvas.toDataURL();
  });

  const buf = Buffer.from(imageDataURL.replace(/^data:image\/\w+;base64,/, ''), 'base64');

  const minioClient = Promise.promisifyAll(new minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    secure: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  }));

  try {
    const screenshotFilename = '20180710133433.png';
    await minioClient.putObjectAsync(
      'aq0urs',
      screenshotFilename,
      buf,
      buf.length,
    );
    const url = await minioClient.presignedUrlAsync(
      'GET', 'aq0urs', screenshotFilename, moment.duration(1, 'days').asSeconds(),
    );
    console.log(url);
  } catch (err) {
    console.error('Failed take screenshot', err);
  }

  await page.close();
  await browser.close();
})();
