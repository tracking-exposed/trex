#!/usr/bin/env bash

set -e -x

yarn dist:linux
# CONTAINER_NAME=electron-builder-node-16

# docker exec --privileged $CONTAINER_NAME bash -c "yarn"
# docker exec --privileged $CONTAINER_NAME bash -c "chown -R ${USER}:${GROUP} /project"
# docker exec --privileged $CONTAINER_NAME bash -c "chown -R ${USER}:${GROUP} /root/.cache/"
# docker exec $CONTAINER_NAME bash -c "yarn guardoni dist:linux"
# docker exec $CONTAINER_NAME bash -c "yarn guardoni dist:windows"

# docker stop $CONTAINER_NAME
# docker rm $CONTAINER_NAME
