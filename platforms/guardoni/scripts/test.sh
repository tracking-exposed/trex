#!/usr/bin/env bash

# set -e -x
set -e
version=2.4.8

yarn clean
yarn yt:ext build:guardoni
yarn tk:ext build:guardoni

yarn guardoni build

yarn pm2 start --env test platforms/yttrex/backend/ecosystem.config.js
sleep 10
DEBUG="*" yarn test guardoni --ci
yarn pm2 stop all

yarn guardoni pkg

./dist/guardoni-cli-$version-linux \
  --basePath ./ \
  -c "$(pwd)/platforms/guardoni/guardoni.config.json" \
  yt-list

./dist/guardoni-cli-$version-linux \
  --basePath ./ \
  -c "$(pwd)/platforms/guardoni/guardoni.config.json" \
  tk-list
