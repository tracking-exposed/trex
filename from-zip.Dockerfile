
FROM alpine:3.5 as unzip

WORKDIR /app

RUN apk add -U unzip && rm -rf /var/cache/apk/*

COPY .yarnrc.yml tsconfig.json package.json ./
COPY ./build/trex.zip ./
RUN unzip -o -d ./ trex.zip

FROM node:16.14-alpine as build

WORKDIR /app

COPY --from=unzip /app ./

RUN yarn install
RUN yarn why canvas
RUN yarn yt:ext dist
RUN yarn tk:ext dist
