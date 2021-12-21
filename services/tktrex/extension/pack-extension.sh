#!/usr/bin/env bash

rm -rf ./dist
NODE_ENV=production node_modules/.bin/webpack -p

echo "Manually removing 'localhost:9000' from the manifest.json"
# This is savage.
grep -v localhost manifest.json | grep -v 127\.0 > ./dist/manifest.json
#echo "Developer, remind to check if ../backend/parsers/longlabel.js and src/longlabel.js differs!"
#V=`git tag -l | head -1`
#sed -es'/BUILD_VERSION/'$V'/' src/popup/popup.html  > dist/popup.html

cp src/popup/* ./dist
cp icons/* ./dist
cd ./dist
zip extension.zip * 

