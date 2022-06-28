#!/usr/bin/sh

set -ex
# this script is invoked by npm run pkg, and simply should rename the executabled with the proper version name.

version=$(grep version package.json | cut -b 15- | sed -es/\".*//)

DEBUG_PKG=1 ./dist/guardoni-cli-$version-linux --help
