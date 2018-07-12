const { URL } = require('url');
const Color = require('color2');
const moment = require('moment');

module.exports = class ActiveItem {
  constructor(args) {
    try {
      this.url = new URL(args.url);
    } catch (err) {
      this.url = null;
    }
    this.date = moment(args.dateText, 'YYYY.MM.DD');
    this.color = new Color(args.colorText);
    this.title = args.title.trim();
  }

  get Url() { return this.url; }

  get Date() { return this.date; }

  get Color() { return this.color; }

  get Title() { return this.title; }

  isNewer(date) {
    const now = date || moment();
    return now.subtract(1, 'days').startOf('date') <= this.Date();
  }

  getSlackAttachment() {
    return {
      color: this.Color.hexString(),
      title: this.Title,
      title_link: (this.Url === null ? null : this.Url.toString()),
      ts: this.Date.unix(),
    };
  }
};
