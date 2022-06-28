#!/usr/bin/sh

set -ex
# this script is invoked by npm run pkg, and simply should rename the executabled with the proper version name.

# the `--public` option enables correct transpyling
# of the function given to puppeteer's `page.evaluate`

pkg -c ./package.json \
  --debug \
  --public \
  -C GZip \
  ./bin/guardoni-cli.js

version=$(grep version package.json | cut -b 15- | sed -es/\".*//)

cd ./dist
mv guardoni-win.exe guardoni-cli-$version.exe
mv guardoni-macos guardoni-cli-$version-macos
mv guardoni-linux guardoni-cli-$version-linux
chmod +x ./*-cli-*
