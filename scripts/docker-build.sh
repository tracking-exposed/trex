#!/usr/bin/env bash

set -e

DATE=$(date +%m.%y)

docker build \
  --build-arg NODE_VERSION=16.10.0 \
  -t electronuserland/builder:16-wine \
  -t "electronuserland/builder:16-$DATE" \
  -t electronuserland/builder:latest \
  docker/electron-builder
