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

By default now, data collected will be sent to the default mongo, configured in `yttrex/backend/config/settings.json`

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

If you want to see your extension homepage generated from your local data, you need to launch the hugo server of [youtube.tracking.exposed](https://github.com/tracking-exposed/youtube.tracking.exposed)
Clone this repo (and its theme, as described in its README) then start Hugo with

`hugo -D server`

With this, the personal page from the extnesion should be able to render

TODO options to describe:

  --exclude
  --experiment
  --backend
  --chrome


## ChiaroScuro usage 

you need a CSV with this format:

  videoURL,title

the videoURL should start with http and must be a valid youtube video Id
the title should be the title of that video (hint: they might be translated)

guardoni, if invoked with --csv option, it perfor the chiaroscuro test and this makes onother option mandatory:

 --csv
 --nickname

behind the scene, it would offer as feedback:

* and experiment name and the associated URL where you can compare this test
* in the same link you can compare the result from different nicknames
* it would create a temporary profile, from scratch, at every execution; because of this, you should open youtube.com and accept the opt-in manually.

if you want to use an existing profile, --profile option can be used.

### ChiaroScuro design

1. from the CSV + the nickname guardoni defines the local paths, names, IDs. Same people with same csv = same experiment
2. guardoni invokes an API (POST to /api/v3/chiaroscuro) that upload the CSV and the hash. the server save the list of video and title, and thanks to this would produce a guardoni directive. this API avoid duplication of the same experiments. in the backend, is the collection 'chiaroscuro' containing these entries.
3. guardoni uses the same experiment API to mark contribution with 'nickname'
4. it would then access to the directive API, and by using the experimentId, will then perform the searches as instructed.

