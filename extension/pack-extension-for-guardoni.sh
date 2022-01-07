#!/usr/bin/env bash

rm -rf ./dist
NODE_ENV=production BUILD_TARGET=guardoni yarn build

