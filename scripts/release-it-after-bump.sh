#!/usr/bin/env bash

set -e -x

export DEBUG="@trex:*"
export NODE_ENV=production

yarn shared build
yarn taboule build
yarn extension dist
yarn extension dist:guardoni
yarn guardoni build
yarn guardoni pkg
yarn guardoni dist:all
yarn tk:ext build

export DOTENV_CONFIG_PATH=$YCAI_DOTENV_CONFIG_PATH
yarn ycai build:ext
