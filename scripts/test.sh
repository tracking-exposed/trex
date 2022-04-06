#!/usr/bin/env bash

set -e -x

export DEBUG="@trex*"
export NODE_ENV=development

yarn shared build

yarn yt:backend build

# bootstrap yttrex backend processes
cd ./platforms/yttrex/backend
yarn pm2 start ecosystem.test.config.js
cd ../../../

# test backend
# yarn yt:backend test

# build yttrex extension
yarn yt:ext build
yarn yt:ext pack
# yarn yt:ext test

# build guardoni
yarn guardoni build
yarn guardoni pkg

# register an experiment
experiment_entry="$(yarn guardoni cli yt-register ./experiments/trex-yt-videos.csv | grep 'experimentId:')"
experiment_id=${experiment_entry/'experimentId: '/''}

# exec the experiment
yarn guardoni cli yt-experiment -c guardoni.config.json --headless $experiment_id

yarn pm2 stop all