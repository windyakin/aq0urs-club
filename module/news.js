const ActiveItem = require('./active-item');

module.exports = class News extends ActiveItem {
  constructor(url, dateText, category, categoryColorText, title) {
    super(url, dateText, categoryColorText, title);
    this.category = category;
  }

  get Category() { return this.category; }

  getSlackAttachment() {
    return {
      color: this.Color.hexString(),
      title: this.Title,
      title_link: this.Url,
      footer: this.Category,
      ts: this.Date.unix(),
    };
  }
};
