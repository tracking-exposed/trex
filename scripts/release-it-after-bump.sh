#!/usr/bin/env bash

set -e -x

export DEBUG="@trex:*"

yarn shared build
yarn taboule build
yarn yt:ext dist
yarn yt:ext dist:guardoni
yarn tk:ext build
yarn guardoni build:cli
yarn guardoni pkg
yarn guardoni build:app


export DOTENV_CONFIG_PATH=$YCAI_DOTENV_CONFIG_PATH
yarn ycai build
