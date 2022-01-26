#!/usr/bin/env bash

set -e -x

CONTAINER_NAME=electron-builder-node-16
USER=$(id -u)
GROUP=$(id -g)

docker exec $CONTAINER_NAME bash -c "yarn"
docker exec $CONTAINER_NAME bash -c "chown -R ${USER}:${GROUP} /project"
docker exec $CONTAINER_NAME bash -c "chown -R ${USER}:${GROUP} /root/.cache/"

docker exec --user "${USER}:${GROUP}" $CONTAINER_NAME bash -c "yarn guardoni dist:linux"
docker exec --user "${USER}:${GROUP}" $CONTAINER_NAME bash -c "yarn guardoni dist:windows"

docker stop $CONTAINER_NAME
docker rm $CONTAINER_NAME
