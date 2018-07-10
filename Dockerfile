FROM node:8-slim

# NOTE: See https://crbug.com/795759
RUN apt-get update \
  && apt-get install -y libgconf-2-4 \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

RUN apt-get install -y --no-install-recommends \
      wget \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      google-chrome-unstable \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser \
  && mkdir -p /usr/src/app \
  && chown -R pptruser:pptruser /usr/src/app

ENV CHROME_EXECUTE_PATH=google-chrome-unstable

USER pptruser

WORKDIR /usr/src/app

COPY --chown=pptruser:pptruser package.json .
COPY --chown=pptruser:pptruser package-lock.json .

RUN npm install --production

COPY --chown=pptruser:pptruser . .

RUN mkdir -p cookie screenshot

CMD ["npm", "run-script", "cron"]
