FROM node:16-slim

RUN mkdir /guardoni
WORKDIR /guardoni
RUN apt-get update
RUN apt-get install -y python3 build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

ADD ./ ./

RUN yarn install
RUN yarn tk:ext build
RUN yarn yt:ext build
RUN yarn guardoni build
RUN yarn guardoni pkg

FROM selenium/standalone-chrome:102.0
COPY --from=0 /guardoni/node_modules/guardoni/dist/guardoni-cli-2.5.4-linux guardoni-cli

