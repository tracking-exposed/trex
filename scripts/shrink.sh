#!/usr/bin/bash

# This script is necessary to produce the .zip files to submit to mozilla store
# Otherwise the repo is too big

x=`grep tracking.exposed package.json | grep description | wc -l`
if [ $x -ne 1 ]; then
   echo "this script should be executed from the trex directory only, in this way: scripts/shrink.sh"
fi

mkdir -p build;

# echo "This script is going to execute some rm -rf so please do it only from"
# echo "https://github.com/tracking-exposed/trex/archive/refs/heads/master.zip"

# if [ -e ".git" ]; then
#    echo ".git directory found, not executing!"
#    echo "downloading https://github.com/tracking-exposed/trex/archive/refs/heads/master.zip"
#    wget https://github.com/tracking-exposed/trex/archive/refs/heads/master.zip
#    echo "now please unzip, enter and re-execute"
#    exit;
# fi

suffix=$('grep version package.json  | sed -es/.*:// | sed -es/[\ \",]//g')
fileout="build/trex${suffix}.zip"

echo "Removing $fileout"
rm "$fileout"

echo "zipping in $fileout"

# this should not be present anyways

# rm -rf node_modules

# this contains a lot of test files
echo "Removing test files and unnecessary folders"
# rm -rf platforms/*/backend

echo "Creating new version of README for extension reviewer"
echo -e "## Extension reviewer TODOs\n\n" > TODO.md
echo -e 'Place the `trex.zip` in a folder an unzip it \n' >> TODO.md
echo -e "### Requirements\n" >> TODO.md
echo -e '- yarn `v3`\n - node `16` \n' >>  TODO.md
echo -e "#### Installation \n" >> TODO.md
echo -e 'Install dependencies\n' >> TODO.md
echo -e '```bash\nyarn\n```\n' >> TODO.md
echo -e "tktrex is tiktok.tracking.exposed extension\n" >> TODO.md
echo -e '```bash\nyarn tk:ext dist\nls -l platforms/tktrex/extension/dist/*.zip\n```\n' >> TODO.md
echo -e "yttrex is youtube.tracking.exposed extension\n" >> TODO.md
echo -e '```bash\nyarn yt:ext dist\nls -l platforms/yttrex/extension/dist/*.zip\n```\n' >> TODO.md
echo -e "ycai is youchoose.ai extension\n" >> TODO.md
echo -e '```bash\nyarn ycai build\nls -l platforms/ycai/studio/build/extension/*.zip\n```\n' >> TODO.md

mv README.md .README.md
mv TODO.md README.md

zip $fileout -r ./* \
  .npmrc .nvmrc .yarn .yarnrc.yml \
  -x "yarn.lock" \
  -x ".yarn/unplugged/**" \
  -x ".yarn/cache/**" \
  -x ".vscode/**" \
  -x ".husky/**" \
  -x ".github/**" \
  -x "node_modules/**" -x "*/node_modules/**" "**/node_modules/**" \
  -x "**/__spec__/**" \
  -x "**/__tests__/**" \
  -x "docs/**" -x "**/docs/**" \
  -x "coverage/**" -x "**/coverage/**" \
  -x "downloads/**" -x "**/downloads/**" \
  -x "logs/**" -x "**/logs/**" \
  -x "docker/**" \
  -x "build/**" -x "**/build/**" \
  -x "scripts/**" -x "**/scripts/**" \
  -x "platforms/storybook/**" \
  -x "platforms/guardoni/**" \
  -x "platforms/*/backend/**" \
  -x "platforms/*/backend/**" \

zip $fileout scripts/install-from-shrinkzip.sh

rm README.md
mv .README.md README.md

echo "done!"
