const puppeteer = require('puppeteer');

const DEFAULT_LAUNCH_OPTION = {
  headless: false,
};

module.exports = class Browser {
  constructor(launchOption) {
    return new Promise(async (resolve, reject) => {
      if (this.browser) { return resolve(this.browser); }
      try {
        this.browser = await puppeteer.launch(Object.assign(DEFAULT_LAUNCH_OPTION, launchOption));
        this.page = await this.browser.newPage();
      } catch (err) {
        reject(err);
      }
    });
  }

  get Browser() {
    return this.browser;
  }

  get Page() {
    return this.page;
  }

  async getElementBackgroundImageDataURL(selector) {
    const imageDataURL = await this.page.$eval(selector, async (element) => {
      const image = document.createElement('img');
      image.src = this.trimStyleSheetUrlFormat(window.getComputedStyle(element).backgroundImage);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;

      await new Promise((resolve) => {
        if (image.complete || image.width > 0) resolve();
        image.addEventListener('load', () => resolve());
      });

      context.drawImage(image, 0, 0);

      return canvas.toDataURL();
    });
    return imageDataURL;
  }

  async close() {
    try {
      this.page.close();
    } catch (err) {
      console.error(err);
    }
    try {
      this.browser.close();
    } catch (err) {
      console.error(err);
    }
  }

  static trimStyleSheetUrlFormat(urlFormat) {
    return urlFormat.split('"')[1];
  }
};
