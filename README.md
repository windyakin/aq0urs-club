# Aq0urs CLUB

Crawling the Aq0urs CLUB website and posting content updates to Slack.

## Getting started

### Immediate

```shell
docker run --rm -it \
  -e AQ0URS_CLUB_ID=[Email address] \
  -e AQ0URS_CLUB_PASSWORD=[Raw password] \
  -e SLACK_WEBHOOK_URL=[Slack incomming webhook URL] \
  windyakin/aq0urs-club npm start
```

### Cron

```shell
docker run --rm -it \
  -e CRONRANGE=[cron range format] \
  -e AQ0URS_CLUB_ID=[Email address] \
  -e AQ0URS_CLUB_PASSWORD=[Raw password] \
  -e SLACK_WEBHOOK_URL=[Slack incomming webhook URL] \
  windyakin/aq0urs-club npm run cron
```

## Environments

|      Variable name       |                              Description                               |           Example value           |
| :----------------------- | :--------------------------------------------------------------------- | :-------------------------------- |
| `CRONRANGE` *            | Cron range setting by [node-cron][] (include seconds)                  | `0 0 9,13,21 * * *`               |
| `AQ0URS_CLUB_ID` *       | Aq0urs CLUB login ID (Email Address)                                   | `aq0urs-club@example.com`         |
| `AQ0URS_CLUB_PASSWORD` * | Aq0urs CLUB login password (Raw value)                                 | `passw0rd`                        |
| `SLACK_WEBHOOK_URL` *    | [Incomming webhook url of Slack][] to post                             | `https://hooks.slack.com/...`     |
| `PUPPETEER_TIMEOUT`      | [Puppeteer][] time out time (milli second). Default value is `30000`   | `30000`                           |
| `CHROME_EXECUTE_PATH`    | Entrypoint path of Google Chrome (puppeteer's `executablePath` option) | `/usr/bin/google-chrome-unstable` |

`*`: Required parameters

[node-cron]:https://www.npmjs.com/package/cron
[Incomming webhook url of Slack]:https://api.slack.com/incoming-webhooks
[Puppeteer]:https://github.com/GoogleChrome/puppeteer

## License

This program is under the [MIT License](LICENSE)

## Copyright

&copy; 2018 windyakin

## Author

* windyakin ([GitHub](https://github.com/windyakin) / [Twitter](https://twitter.com/MITLicense))
