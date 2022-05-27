#!/usr/bin/env bash

set -e -x

export NODE_ENV=development

yarn clean
yarn yt:ext build:guardoni
yarn tk:ext build:guardoni

yarn build
yarn pkg
