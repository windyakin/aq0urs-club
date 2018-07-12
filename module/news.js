const ActiveItem = require('./active-item');

module.exports = class News extends ActiveItem {
  constructor(args) {
    super({
      url: args.url,
      dateText: args.dateText,
      colorText: args.categoryColorText,
      title: args.title,
    });
    this.category = args.category;
  }

  get Category() { return this.category; }

  getSlackAttachment() {
    return Object.assign(super.getSlackAttachment(), { footer: this.Category });
  }
};
