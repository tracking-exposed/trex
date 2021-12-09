FROM node:14-slim as build

WORKDIR /app

COPY ./tsconfig.json ./
COPY ./shared ./shared
COPY ./backend ./backend
COPY ./YCAI ./YCAI


WORKDIR /app/shared
RUN yarn install
RUN yarn run build

WORKDIR /app/backend
RUN yarn install


WORKDIR /app/YCAI
RUN yarn install
RUN yarn run build
