#!/usr/bin/bash

set -x

# This script is necessary to produce the .zip files to submit to mozilla store
# Otherwise the repo is too big

out=../trex-from-zip

mkdir -p $out

# cp ./build/trex.zip $out/

unzip -o -d $out build/trex.zip

cd $out || exit

yarn install

yarn tk:ext build
yarn yt:ext build
yarn ycai build
