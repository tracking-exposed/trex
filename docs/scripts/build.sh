#!/usr/bin/env bash

set -e -x
# set -e

# build shared
yarn shared build
yarn yt:shared build
yarn yt:shared open-doc-api
yarn tk:shared build
yarn tk:shared open-doc-api
yarn ycai open-doc-api
yarn docs build
