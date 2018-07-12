const striptags = require('striptags');

const ActiveItem = require('./active-item');

module.exports = class Entry extends ActiveItem {
  constructor(args) {
    super({
      url: args.url,
      dateText: args.dateText,
      colorText: args.authorColorText,
      title: args.title,
    });
    this.author = args.author;
    this.summary = args.summary;
  }

  get Author() { return this.author; }

  get Summary() { return striptags(this.summary); }

  getSlackAttachment() {
    return Object.assign(super.getSlackAttachment(), { text: this.Summary, footer: this.Author });
  }
};
