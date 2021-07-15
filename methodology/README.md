To run `guardoni`make sure you are in the methodology directory before executing:
``` 
cd yttrex/methodology
src/guardoni.js 
```
Then follow the guidance from the command line to provide the options, such as:
```
src/guardoni.js --source https://youtube.tracking.exposed/json/automation-example.json --profile yourCustomName
```

don't forget to set environment variable 'DEBUG' to control the verbosity
`DEBUG=*` will print everything, including a lot of `pupeteer` noise
to exclude it, do for instance:
```
DEBUG=*,-puppeteer:* src/guardoni.js
```

If you get the error (seen on mac):
```
Error in operateBrowser (collection fail): Error: Browser is not downloaded. Run "npm install" or "yarn install"
```
It means that `puppeteer` cannot find the chromium executable. First try to run `npm install`, if it still doesn't run, you need to specify the path of the chromium executable by hand. To find it, open chromium and go to the page `chrome://version`, copy paste the `Executable Path` and add it as an argument `--chrome`  to the guardoni script, as such:
```
src/guardoni.js --source https://youtube.tracking.exposed/json/automation-example.json --profile profileTest --chrome /Applications/Chromium.app/Contents/MacOS/Chromium
```

## Run guardoni locally

By default guardoni downloads an extension version `.99` already built and places it in `yttrex/methodology/extension` which has default opt-in (meant for robots). 
By default this extension sends the results to the server.
To get an extension which sends the resuts to the local mongo database you have to build it yourself as explained in the project readMe, and then move the local built to methodology/extension:
```
cd yttrex/extension
npm install
npm run build # will build in the build directory
cd build
cp * ../../methodology/extension # move the extension to directory used by guardoni
```
The extension should be enabled with the popup the first time. (otherwise checkout to `extension-default-opt-in` branch before building)

Then, launch the local server:
```
cd yttrex/backend
npm install
npm run watch
```
Now the extension is running locally.


options to describe:
--exclude
--experiment
--backend
--chrome


supported parameters in directives:


