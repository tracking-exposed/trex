#!/usr/bin/sh

# this script is invoked by npm run pkg, and simply should rename the executabled with the proper version name.

version=`grep version package.json | cut -b 15- | sed -es/\".*//`
# 1.8.2

cd dist
mv guardoni-win.exe guardoni-cli-$version.exe
mv guardoni-macos guardoni-cli-$version-macos
mv guardoni-linux guardoni-cli-$version-linux
chmod +x *
ls -l
cd ..
