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
