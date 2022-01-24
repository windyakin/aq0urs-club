FROM node:16-slim
ENV DEBIAN_FRONTEND=noninteractive

# Install Japanese Font
RUN mkdir -p /tmp/noto \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    wget \
    udev \
    unzip \
    fontconfig \
    ca-certificates \
  && wget -q -O /tmp/noto/noto.zip https://noto-website.storage.googleapis.com/pkgs/NotoSansCJKjp-hinted.zip \
  && unzip -d /tmp/noto/fonts /tmp/noto/noto.zip \
  && mkdir -p /usr/share/fonts/noto \
  && cp /tmp/noto/fonts/*.otf /usr/share/fonts/noto \
  && chmod 655 -R /usr/share/fonts/noto/ \
  && fc-cache -fv \
  && rm -rf /tmp/noto \
  && apt-get --force-yes remove -y --purge \
    wget \
    udev \
    unzip \
    fontconfig \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/* \
  && apt-get autoremove -y \
  && rm -rf /src/*.deb

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser \
  && mkdir -p /usr/src/app \
  && chown -R pptruser:pptruser /usr/src/app

ENV CHROME_EXECUTE_PATH=/usr/bin/chromium

USER pptruser

WORKDIR /usr/src/app

COPY --chown=pptruser:pptruser package.json .
COPY --chown=pptruser:pptruser package-lock.json .

RUN npm install --production

COPY --chown=pptruser:pptruser . .

RUN mkdir -p cookie screenshot

CMD ["npm", "run-script", "cron"]
