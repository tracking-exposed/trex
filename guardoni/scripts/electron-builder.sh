#!/usr/bin/env bash

set -e -x

CONTAINER_NAME=electron-builder-node-16

docker exec $CONTAINER_NAME bash -c "yarn"
docker exec --user "$(id -u):$(id -g)" $CONTAINER_NAME bash -c "yarn guardoni dist:linux"
docker exec --user "$(id -u):$(id -g)" $CONTAINER_NAME bash -c "yarn guardoni dist:windows"

docker stop $CONTAINER_NAME
docker rm $CONTAINER_NAME
