#!/usr/bin/env bash

rm -rf ./dist
NODE_ENV=production node_modules/.bin/webpack -p

echo "Manually removing 'localhost:9000' from the manifest.json"
# This is savage.

cp public/* ./dist
grep -v localhost ./public/manifest.json | grep -v 127\.0 > ./dist/manifest.json
cd ./dist
zip extension.zip * 

