#!/usr/bin/bash

# This script is necessary to produce the .zip files to submit to mozilla store
# Otherwise the repo is too big

x=`grep tracking.exposed package.json  | wc -l`
if [ $x -ne 1 ]; then
   echo "this script should be executed from the trex directory only"
   echo "as scripts/shrink.sh"
fi

echo "This script is going to execute some rm -rf so please do it only from"
echo "https://github.com/tracking-exposed/trex/archive/refs/heads/master.zip"

if [ -e ".git" ]; then
   echo ".git directory found, not executing!"
   echo "downloading https://github.com/tracking-exposed/trex/archive/refs/heads/master.zip"
   wget https://github.com/tracking-exposed/trex/archive/refs/heads/master.zip
   echo "now please unzip, enter and re-execute"
   exit;
fi

# this is the biggest cache
echo "Removing .yarn/cache"
rm -rf .yarn/cache

# this should not be present anyways
echo "Removing node_modules"
rm -rf node_modules

# this contains a lot of test files
echo "Removing test files and unnecessary folders"
rm -rf platforms/*/backend

echo "Creating new version of README for extension reviewer"
echo -e "### Extension reviewer TODOs\n\nyarn\nyarn tk:ext dist\nls -l platforms/tktrex/extension/dist\nyarn yt:ext dist\nls -l platforms/yttrex/extension/dist\n" > README.md

suffix=`grep version package.json  | sed -es/.*:// | sed -es/[\ \",]/-/g`
fileout="trex${suffix}.zip"
echo "zipping in $fileout"
zip $fileout -r ./*
echo "done!"
