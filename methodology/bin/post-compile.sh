#!/usr/bin/sh

# this script is invoked by npm run pkt, and simply should rename the executabled with the proper version name.

version=`grep version package.json | cut -b 15- | sed -es/\".*//`
# 1.8.2

cd dist
mv guardoni-win.exe guardoni-$version.exe
mv guardoni-macos guardoni-$version-macos
mv guardoni-linux guardoni-$version-linux
ls -l
cd ..
