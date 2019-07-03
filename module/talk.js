const striptags = require('striptags');

const ActiveItem = require('./active-item');

module.exports = class Entry extends ActiveItem {
  constructor(args) {
    super({
      url: args.url,
      dateText: args.dateText,
      colorText: '#ff3737',
      title: args.title,
    });
    this.backgroundImage = args.backgroundImage;
  }

  get Author() { return this.author; }

  get Summary() { return striptags(this.summary); }

  get ImageUrl() { return this.backgroundImage.split('"')[1]; }

  getSlackAttachment() {
    return Object.assign(
      super.getSlackAttachment(),
      {
        text: this.Summary,
        footer: this.Author,
        thumb_url: this.ImageUrl,
      },
    );
  }
};
