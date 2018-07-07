const request = require('request-promise');

module.exports = class SlackService {
  static getWebhookUrl() {
    return process.env.SLACK_WEBHOOK_URL;
  }

  static async postMessage(text, items) {
    request({
      method: 'POST',
      uri: this.getWebhookUrl(),
      body: {
        text,
        attachments: items.map(item => item.getSlackAttachment()),
      },
      json: true,
    });
  }
};
