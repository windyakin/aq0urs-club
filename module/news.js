const ActiveItem = require('./active-item');

module.exports = class News extends ActiveItem {
  constructor(url, dateText, category, categoryColorText, title) {
    super(url, dateText, categoryColorText, title);
    this.category = category;
  }

  get Category() { return this.category; }

  getSlackAttachment() {
    return Object.assign(super.getSlackAttachment(), { footer: this.Category });
  }
};
