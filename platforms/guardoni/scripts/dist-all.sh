#!/usr/bin/env bash

set -e -x

export NODE_ENV='production'

yarn guardoni build
yarn dist:linux
# yarn dist:windows
# yarn dist:mac
