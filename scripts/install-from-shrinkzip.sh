#!/usr/bin/bash

set -ex

# This script is necessary to produce the .zip files to submit to mozilla store
# Otherwise the repo is too big

from=${1:-build/trex.zip}
out=${2:-./build}

mkdir -p $out

# cp ./build/trex.zip $out/

unzip -o -d $out $from

cd $out || exit

yarn install

yarn tk:ext dist
ls -l platforms/tktrex/extension/dist/*.zip
yarn yt:ext dist
ls -l platforms/yttrex/extension/dist/*.zip
yarn ycai build
ls -l platforms/ycai/studio/build/extension/*.zip

