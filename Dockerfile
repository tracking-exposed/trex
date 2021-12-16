FROM node:16-slim as build

WORKDIR /app

COPY .yarn  ./.yarn
COPY .yarnrc.yml tsconfig.json package.json ./
COPY ./shared ./shared
COPY ./backend ./backend
COPY ./YCAI ./YCAI

RUN yarn install
RUN yarn build
