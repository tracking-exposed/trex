FROM node:16-slim

RUN mkdir /guardoni
WORKDIR /guardoni
RUN apt-get update
RUN apt-get install -y python3 build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

ADD ./ ./

RUN yarn install
RUN yarn tk:ext build
RUN yarn yt:ext build
RUN yarn guardoni build:cli
RUN yarn guardoni pkg
WORKDIR /guardoni/platforms/guardoni/dist/
RUN mv $(ls -1 guardoni-cli*-linux) guardoni-cli

FROM selenium/standalone-chrome:102.0
WORKDIR /guardoni

COPY --from=0 /guardoni/platforms/guardoni/dist/guardoni-cli guardoni-cli
COPY --from=0 "/guardoni/node_modules/@tktrex/extension/build" tktrex
COPY --from=0 "/guardoni/node_modules/@yttrex/extension/build" yttrex
COPY --from=0 /guardoni/docker/guardoni/guardoni.config.json .

ENTRYPOINT [ "/guardoni/guardoni-cli" ]
