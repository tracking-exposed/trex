#!/usr/bin/env bash

rm -rf ./dist
mkdir ./dist

echo "Manually removing 'localhost:9000 and localhost' from the manifest.json"
grep -v localhost manifest.json | grep -v 127\.0 > ./dist/manifest.json

cp src/embedded/* ./dist
cp icons/* ./dist
NODE_ENV=production node_modules/.bin/webpack

cd ./dist
zip extension.zip * 

