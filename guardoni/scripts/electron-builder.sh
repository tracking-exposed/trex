#!/usr/bin/env bash

set -e -x

CONTAINER_NAME=electron-builder-node-16
CWD=$PWD/../

docker run -d --name $CONTAINER_NAME -i \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${CWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 electronuserland/builder:16-wine

docker exec -i $CONTAINER_NAME bash -c "yarn"
docker exec -i $CONTAINER_NAME --user "$(id -u):$(id -g)" bash -c "yarn guardoni dist:linux"
docker exec -i $CONTAINER_NAME --user "$(id -u):$(id -g)" bash -c "yarn guardoni dist:windows"

docker stop $CONTAINER_NAME
