FROM node:16-alpine

RUN mkdir /guardoni
WORKDIR /guardoni
ADD ./ ./

RUN apk add python3

RUN yarn install
RUN yarn tk:ext build
RUN yarn yt:ext build
RUN yarn guardoni build
