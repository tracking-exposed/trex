#!/usr/bin/env bash

yarn clean

NODE_ENV=production yarn build

echo "Manually removing 'localhost:9000' from the manifest.json"
# This is savage.

cp public/* ./dist
grep -v localhost ./public/manifest.json | grep -v 127\.0 > ./dist/manifest.json
cd ./dist
zip extension.zip *

