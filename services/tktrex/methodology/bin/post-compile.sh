#!/usr/bin/sh

# this script is invoked by npm run pkt, and simply should rename the executabled with the proper version name.

version=`grep version package.json | cut -b 15- | sed -es/\".*//`
echo $version

cd dist
ls -l
mv guardoni0-base-win.exe guardoni0-$version.exe
mv guardoni0-base-macos guardoni0-$version-macos
mv guardoni0-base-linux guardoni0-$version-linux
ls -l
cd ..
