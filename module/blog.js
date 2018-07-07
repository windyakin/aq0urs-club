const striptags = require('striptags');

const ActiveItem = require('./active-item');

module.exports = class Entry extends ActiveItem {
  constructor(url, dateText, author, authorColorText, title, summary) {
    super(url, dateText, authorColorText, title);
    this.author = author;
    this.summary = summary;
  }

  get Author() { return this.author; }

  get Summary() { return striptags(this.summary); }

  getSlackAttachment() {
    return {
      color: this.Color.hexString(),
      title: this.Title,
      title_link: this.Url.toString(),
      text: this.Summary,
      footer: this.Author,
      ts: this.Date.unix(),
    };
  }
};
