const { URL } = require('url');
const Color = require('color2');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

module.exports = class ActiveItem {
  constructor(args) {
    try {
      this.url = new URL(args.url);
    } catch (err) {
      this.url = null;
    }
    this.date = dayjs(args.dateText, 'YYYY.MM.DD');
    this.color = new Color(args.colorText);
    this.title = args.title.trim();
  }

  get Url() { return this.url; }

  get Date() { return this.date; }

  get Color() { return this.color; }

  get Title() {
    const newEmoji = this.isNewer() ? ':new_item:' : '';
    return `${newEmoji} ${this.title}`.trim();
  }

  isNewer(date) {
    const now = date || dayjs();
    return now.subtract(1, 'days').startOf('date') <= this.Date;
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
