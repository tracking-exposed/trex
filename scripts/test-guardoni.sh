#!/usr/bin/env bash

# set -e -x
set -e

docker-compose up -d mongo-tk-test-indexes mongo-yt-test-indexes

cd ./platforms/guardoni || exit;

./scripts/cli-build.mjs
./scripts/cli-yt-test-home.mjs
./scripts/cli-yt-test-videos.mjs

yarn pm2 stop all
