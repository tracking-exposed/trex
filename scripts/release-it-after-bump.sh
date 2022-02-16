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
yarn ycai build:ext
