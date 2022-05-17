#!/usr/bin/env bash

# set -e -x
set -e

export DEBUG="@trex*"
export NODE_ENV=development
export DOTENV_CONFIG_PATH=.env.development

yarn workspaces foreach run clean

# build shared
yarn shared build

# build yt backend
yarn yt:backend build

# bootstrap yttrex backend processes
yarn pm2 start ./platforms/yttrex/backend/ecosystem.config.js
yarn pm2 save

# test backend
# yarn yt:backend test

# build yttrex extension
yarn yt:ext build

# build tktrex extension
yarn tk:ext build


# build guardoni
yarn guardoni build
# yarn guardoni pkg
