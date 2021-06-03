## Browser extension reviewer? please do this after cloning the repository:

    cd yttrex/extension
    npm install
    npm run build:dist

This produces the **distributed** release, in the directory `dist` you should find `extension.zip` which is thw same file uploaded to Mozilla and Chrome add-ons stores.

## Anybody else (except developers)?

Please refer to [youtube.tracking.exposed](https://youtube.tracking.exposed), with this tools we did a bunch of publications and analysis, you can repeat them or imagine your own!

### Developer? 

Directories:

* backend: please look in bin/ and you'll see microservices, batch processes and utility scripts used by the yttrex toolkit.
* methodology: please read the README.md, the tool is meant to automate access to youtube.
* reach-pieces: and experimental approach on how to build component of the UX with react.
* extension: please keep reading this README, it talks about how is build [this extension](https://addons.mozilla.org/en-US/firefox/addon/yttrex/).

#### Now, if you're a developer interested in the browser extension:

Instead of `build:dist`, use:

  npm run build

The command above produce the in **development release**, the results it is *not minify* and is in `build/`. The in Firefox/Chrom load the directory 'build' because manifest.json is there.

# TL;DR

This is the source code for one of the **tracking-exposed** web-extension and backend HTML parser, plus the API to export analyzed data. The broad scope of the project is described in the [Manifesto](https://tracking.exposed)

## Code

We use ECMAScript 2015, aka ES6, aka ECMAScript Harmony. The aim is to keep the
code modular, easy to test, and beautiful.

## Getting Started
Setting up the dev environment is super easy.

### Dependencies
This project requires Node 5+. Install [nvm](https://github.com/creationix/nvm) for easy version maintaining. Alternatively install Nodejs from a package, but make sure it's the right version and install npm as well for package management.  

### Set up your build system
The build system uses a simple `package.json` file to describe the tasks, you can check it out to find out the packages that we rely on to make this extension available or for troubleshooting.

To get started run:
```
npm install
npm test
npm start
```

The second line (`npm test`) is optional, but testing is cool and you should do
it anyway. It's also a nice way to check if the installation succeeded.
If npm test fails, don't worry and try npm start nonetheless, it might be due to facebook frequent html structure changes or nodejs extensions incompatibility, please report it back to us if this is the case.  

`npm start` will build the application using `webpack` and watch for changes.

Keep `npm start` running in the background to take advantage of the autoreload.


### Set up your browser (for Chromium / Google Chrome)
To install the extension go to **settings**, select **extensions**, and enable
**Developer mode**. Click on **Load unpacked extension** and select the
`extension/build` directory contained in this repo.

### Set up your browser (for Firefox)
As standard practice, firefox doesn't allow unpacked extension to be loaded. However, it does allow developers to test unpacked extensions **temporarily**. To accomplish this just visit [about:debugging], click **Load Temporary Add-on** and select `extension/build` directory contained in this repo.

### Ready to go!
Visit [YouTube](https://www.youtube.com/) and open the dev tools. You should see some logging messages.

### Extend fixtures

 * You've to install the package `tidy` the last version in ubuntu is not
   working (we'll update the comment when fixed), use
   http://binaries.html-tidy.org/
 * Copy the userContentWrapper Element
 * save in file.html

```
tidy -i -m -w 0 -utf8 file.html
```


# Thanks

* [@vrde](https://github.com/vrde) for the perfect basement to hack on
* [@sohkai](https://github.com/sohkai) for the amazing [js-reactor
boilerplate](https://github.com/bigchaindb/js-reactor).

# License

Affero-GPL 3, as file attached in this repository display.
