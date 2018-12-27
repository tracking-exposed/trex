#!/bin/sh

rm -rf ./dist

V=dist/js/ 
mkdir -p dist/css && 
mkdir -p dist/js/local 
mkdir -p dist/images 
mkdir -p dist/static
mkdir -p $V 

echo "User-agent: *\nAllow: /\n" >> dist/robots.txt

node_modules/.bin/stylus styles/index.styl -o dist/css

cp styles/favicon.ico dist/
cp -r ../icons/* dist/images
cp sections/images/* dist/images
cp -r sections/webscripts/* dist/js/local/ 
cp -r node_modules/bootstrap/dist/* dist/
cp styles/WorkSans.ttf dist/fonts

cp node_modules/bootstrap/js/collapse.js $V
cp node_modules/jquery/dist/jquery.js $V 
cp node_modules/moment/min/moment.min.js $V 
cp node_modules/lodash/lodash.min.js $V 
# cp ../dist/extension.zip dist/static
