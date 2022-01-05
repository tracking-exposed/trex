#!/bin/sh -x

cd ../extension
npm run build:dist
cd ../guardoni
rm -rf extension
mkdir extension
cp -r ../extension/build/* ./extension

