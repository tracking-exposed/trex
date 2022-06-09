#!/usr/bin/env bash

set -e -x

export NODE_ENV='production'

yarn guardoni build:app
yarn dist:linux
# yarn dist:windows
# yarn dist:mac
