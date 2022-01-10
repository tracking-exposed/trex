# Guardoni

- [Guardoni](#guardoni)
  - [Getting started](#getting-started)
  - [CLI](#cli)
    - [Effectively executing guardoni](#effectively-executing-guardoni)
      - ["--comparison" kind of CSV](#--comparison-kind-of-csv)
        - [CSV format details](#csv-format-details)
      - ["--shadowban" kind of CSV (chiaroscuro test)](#--shadowban-kind-of-csv-chiaroscuro-test)
        - [ChiaroScuro design](#chiaroscuro-design)
    - [Package](#package)
  - [Electron](#electron)
    - [Development](#development)
    - [Making a release](#making-a-release)
  - [FAQs](#faqs)
    - [Guardoni folder, what's about?](#guardoni-folder-whats-about)

**Prerequisites**:

- node >= 14
- yarn >= 3

## Getting started

By default guardoni downloads an extension version `.99` with default opt-in (meant for automation) already built and places it in `extension` folder in the current directory.
By default this extension sends the results to the server.

To get an extension which sends the results to the local server you have to build it yourself - as explained in details in the [extension project README](../extension/README.md):

```bash
# from the project's root
yarn extension build
```

Once you build the extension you need to compile `guardoni` code too:

```bash
# from the project's root
yarn guardoni build
```

Then you'll be able to execute both [cli](#cli) and [electron](#electron) programs.

## CLI

This package also provide a `bin` executable that can be accessed with:

```bash
yarn guardoni --args
```

or, if you downloaded the executable, the output would be an help message like this:

```bash

.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.
Options can be set via: env , --longopts, and static\settings.json file
Three modes exists to launch Guardoni:


To quickly test the tool:
   --auto:              You can specify 1 (is the default) or 2.

To register an experiment:
   --csv FILENAME.csv   default is --comparison, optional --shadowban

To execute a known experiment:
   --experiment <experimentId>

https://youtube.tracking.exposed/guardoni for full documentation.
 [--evidencetag, --profile, are special option], and --config <file>
You need a reliable internet connection to ensure a flawless collection
~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~
```

Three fundamental arguments exists, and at least one is required. How do they works?

```bash
$ yarn guardoni --csv examples/climateChange/greta-v2.csv
CSV mode: mandatory --comparison or --shadowban; --profile, --evidencetag OPTIONAL
```

When you use the --csv command you are **sending your CSV to the server**, which will answer with an experimentId. Every guardoni execution with `--experiment <experimentId>` would repeat the same configuration of your uploaded CSV.

After the upload, it

```bash
$ yarn guardoni --csv examples/climateChange/greta-v2.csv --comparison
CSV mode: mandatory --comparison or --shadowban; Guardoni exit after upload
  guardoni:yt-cli Getting ready for directive type [comparison] +0ms
  guardoni:yt-cli Registering CSV examples/climateChange/greta-v2.csv as comparison +2ms
  guardoni:yt-cli Read input from file examples/climateChange/greta-v2.csv (407 bytes) 6 records +8ms
  guardoni:yt-cli CSV validated in [comparison] format specifications +3ms
CSV exist, experimentId d75f9eaf465d2cd555de65eaf61a770c82d59451 exists since 2021-09-27T21:30:28.903Z
```

as you can see, it tell you if the CSV registered already exists or since how long it is there.

### Effectively executing guardoni

Once you've an experimentId, you can run, for example:

```bash
yarn guardoni --experiment d75f9eaf465d2cd555de65eaf61a770c82d59451
```

#### "--comparison" kind of CSV

Comparison is the technique you use when a bunch of profiles should perform the exact same actions so they results might be easily compared.

##### CSV format details

you need a CSV with this format:

videoURL,title

the videoURL should start with http and must be a valid youtube video Id
the title should be the title of that video (hint: they might be translated)

```bash
cat examples/climateChange/greta-v2.csv

urltag,watchFor,url
greta1,end,https://www.youtube.com/watch?v=v33ro5lGHQg
greta2,end,https://www.youtube.com/watch?v=GlfW7aYouYQ
greta3,end,https://www.youtube.com/watch?v=2fycgrYgXpA
greta4,21s,https://www.youtube.com/watch?v=DQWMDWWYVz4
climate change,6s,https://www.youtube.com/results?search_query=climate+change
climate alarmism,6s,https://www.youtube.com/results?search_query=climate+alarmism
```

watchFor might be a number of seconds (s), minutes (m), or _end_ to specify the video should play till the end.

#### "--shadowban" kind of CSV (chiaroscuro test)

ChiaroScuro is one of the techniques used to test shadowban or what's alike. Other techniques exists beside ChiaroScuro.

##### ChiaroScuro design

1. from the CSV + the nickname guardoni defines the local paths, names, IDs. Same people with same csv = same experiment
2. guardoni invokes an API (POST to /api/v3/chiaroscuro) that upload the CSV and the hash. the server save the list of video and title, and thanks to this would produce a guardoni directive. this API avoid duplication of the same experiments. in the backend, is the collection 'chiaroscuro' containing these entries.
3. guardoni uses the same experiment API to mark contribution with 'nickname'
4. it would then access to the directive API, and by using the experimentId, will then perform the searches as instructed.

### Package

To produce a valid executable just run:

```bash
yarn pkg
```

## Electron

A portable version of guardoni with a simple UI that provides configuration for the cli command is provided with Electron.

It uses `electron-builder` to produce the distributable packages for community and relies of some electron plugins:

- electron-log
- electron-reloader

### Development

For app development, the code needs to be compiled with `webpack` to produce a valid js, that can be start with `electron`.
Two handy commands are already in place:

```sh
# runs webpack
yarn watch
```

and in another terminal pane:

```sh
# runs electron in reload mode
yarn reload
```

**Debug**: A debug task is defined for VSCode inside `.vscode/launch.json` named "Debug Guardoni Electron Main".

### Making a release

- `yarn build` to compile source code with webpack
- `yarn dist` to package the build source for different targets (linux, macos, win)

## FAQs

### Guardoni folder, what's about?

If you pose the Question: _How to run your own algoritmh accountability experiment?_...

... the answer would be: _by controlling a methodology_

This directory contains a list of scripts that Tracking Exposed team is using to test the youtube algorithm. **Guardoni** is the tool built to allow an easy ripetition of action, evidence collection, and data analysis.

**Load the extension in browser**: The extension should be enabled with the popup the first time. (otherwise checkout to `extension-default-opt-in` branch before building)
Before you can use it, you need to load it by hand:

- Open chromium (or whichever browser you are using for the experiment)
- Go to chrome://extensions
- Enable 'developer mode' with the toggle button on the top right
- A new bar bar menu appears, from which you can pick 'load packaged extension'
- Click, and then select the whole folder `yttrex/guardoni/extension` where the new build has just been added
- Click OK - the extension should load. To see it, click the puzzle piece and pin it to the extension bar.
- Open the extension and turn on the evidence collection.

Before this can work, you need to start the backend server, the mongo database and the parser process.
