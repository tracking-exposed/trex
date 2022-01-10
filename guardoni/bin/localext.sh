#!/bin/sh -x

cd ../extension
npm run build
cd ../guardoni
rm -rf extension
mkdir extension
cp -r ../extension/build/* ./extension

