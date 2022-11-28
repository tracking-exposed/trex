FROM node:16.14-slim as build

WORKDIR /app

COPY .yarn/ .yarn/

COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY tsconfig.json .


COPY packages/shared ./packages/shared
COPY packages/taboule ./packages/taboule
COPY platforms/tktrex ./platforms/tktrex
COPY platforms/yttrex ./platforms/ytrrex
COPY platforms/ycai ./platforms/ycai

RUN yarn install
