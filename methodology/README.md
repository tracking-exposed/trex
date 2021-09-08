## Run Guardoni and send results to server

To run `guardoni` make sure you are in the methodology directory before executing:

``` 
cd yttrex/methodology
npm install
node src/guardoni.js
```

Then follow the guidance from the command line to provide the options, such as:
```
src/guardoni.js --source https://youtube.tracking.exposed/json/automation-example.json --profile yourCustomName --experiment yourExperimentName
```

You can (we normally do) set the environment variable 'DEBUG' to control the verbosity of additional logging.

`DEBUG=*` will print everything, including a lot of `puppeteer` noise
to exclude it, do for instance:

```
DEBUG=*,-puppeteer:* src/guardoni.js
```

If you get the error (seen on mac):
```
Error in operateBrowser (collection fail): Error: Browser is not downloaded. Run "npm install" or "yarn install"
```

It means that `puppeteer` cannot find the chromium executable. First did you run `npm install` ? if it still doesn't run, you need to specify the path of the chromium executable by hand. To find it, open chromium and go to the page `chrome://version`, copy paste the `Executable Path` and add it as an argument `--chrome`  to the guardoni script, as such:
```
src/guardoni.js --source https://youtube.tracking.exposed/json/automation-example.json --profile profileTest --chrome /Applications/Chromium.app/Contents/MacOS/Chromium
```

## Run guardoni locally

**Build the extension**

By default guardoni downloads an extension version `.99` already built and places it in `yttrex/methodology/extension` which has default opt-in (meant for robots). 
By default this extension sends the results to the server.
To get an extension which sends the resuts to the local mongo database you have to build it yourself as explained in the project README , and then move the local built to methodology/extension:

```
cd yttrex/extension
npm install
npm run build
cd build
cp * ../../methodology/extension
```

**Load the extension in browser**

The extension should be enabled with the popup the first time. (otherwise checkout to `extension-default-opt-in` branch before building)
Before you can use it, you need to load it by hand: 
- Open chromium (or whichever browser you are using for the experiment)
- Go to chrome://extensions
- Enable 'developer mode' with the toggle button on the top right
- A new bar bar menu appears, from which you can pick 'load packaged extension'
- Click, and then select the whole folder `yttrex/methodology/extension` where the new build has just been added
- Click OK - the extension should load. To see it, click the puzzle piece and pin it to the extension bar.
- Open the extension and turn on the evidence collection.

Before this can work, you need to start the backend server, the mongo database and the parser process.


**Launch the backend server locally:**

```
cd yttrex/backend
npm install
npm run watch
```

**Launch mongo locally:**

```
mongod
```
By default now, data collected will be sent to the default mongo at `localhost:127.0.0.1`

**Launch parserv**

To parse the HTMLs that are collected and stored in mongo, another process is launch to extract the metadata. Launch it with:
```
cd yttrex/backend
npm run parserv
```

Now you should be set! Get back to the browser and start navigating on YouTube. The backend server, mongo database and the parserv should be receiving new inputs and printing logs.

**To Run a guardoni experiment locally**

You need to specify to `guardoni.js` that the experiment registration should be done with the local backend server.
Use the option `--backend localhost:9000`

**Launch Hugo server**

If you want to see your extension homepage generated from your local data, you need to launch the hugo server of [youtube.tracking.exposed](url)
Clone this repo (and its theme, as described in its readMe) then start Hugo with
`hugo -D server`
Make sure you dont have another hugo server running so that this one runs on the default port at `//localhost:1313/`
With this, the personnal page from the extnesion should be able to render

--------------------

options to describe:
--exclude
--experiment
--backend
--chrome


supported parameters in directives:


