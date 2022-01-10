#!/bin/sh -x

cd ../extension
npm run build
cd ../methodology
rm -rf extension
mkdir extension
cp -r ../extension/build/* ./extension

