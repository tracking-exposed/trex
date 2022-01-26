#!/usr/bin/env bash

set -e

DATE=$(date +%m.%y)

echo "Build electron-builder docker image for node 16"

docker build \
  --build-arg NODE_VERSION=16.10.0 \
  --build-arg USER_ID=$(id -u) \
  --build-arg GROUP_ID=$(id -g) \
  -t electronuserland/builder:16-wine \
  -t "electronuserland/builder:16-$DATE" \
  -t electronuserland/builder:latest \
  docker/electron-builder
