# Guardoni

- [Guardoni](#guardoni)
  - [CLI](#cli)
    - [CLI commands](#cli-commands)
      - [Register CSV](#register-csv)
      - [Running an experiment by id](#running-an-experiment-by-id)
      - [List public directives](#list-public-directives)
      - [Running a default experiment](#running-a-default-experiment)
  - [Build](#build)
    - [Package](#package)
    - [Electron](#electron)
    - [Development](#development)
  - [FAQs](#faqs)
    - [Guardoni folder, what's about?](#guardoni-folder-whats-about)

## CLI

This package also provide a `bin` executable that can be accessed with:

```bash
guardoni-cli --help
```

or, if you downloaded the executable, the output would be an help message like this:

```bash

guardoni-cli [index]

Run guardoni in auto mode cli.

Commands:
  guardoni-cli experiment <experiment>  Run guardoni from a given experiment
  guardoni-cli register <file>          Register an experiment from a CSV
  guardoni-cli [index]                  Run guardoni in auto mode cli. [default]

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
      --headless            Run guardoni in headless mode.
                                                      [boolean] [default: false]
      --evidenceTag         The evidence related tag.                   [string]
      --profile             The current user profile                    [string]
      --backend             The API endpoint for server requests        [string]
      --proxy               Socket proxy for puppeteer.                 [string]
      --adv-screenshot-dir  ADV screenshot directory path               [string]
  -v, --verbose             Produce tons of logs      [boolean] [default: false]
      --index                            [string] [required] [choices: "1", "2"]

Examples:
  guardoni-cli --type comparison
```

### CLI commands

Three fundamental commands exist: `register`, `experiment`, `list` and "auto mode".

How do they works?

#### Register CSV

By giving a relative path to a csv file is possible to register the "experiment".

```bash
guardoni-cli register examples/climateChange/greta-v2.csv
```

The file should contain these keys for each row: `url`, `urltag` and optionally provide `title` and `watchFor`, i.e.:

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

`watchFor` might be a number of seconds (s), minutes (m), or `end` to specify the video should play till the end.

Once you have uploaded your "experiment" you can run the command `experiment` with the returned id.

#### Running an experiment by id

With an experiment id you can run guardoni quite easily:

```bash
guardoni-cli experiment 123456
```

#### List public directives

With this command you can list the public directives available to run.

```bash
guardoni-cli list
```

#### Running a default experiment

Guardoni provides also an `auto` method to run pre-configured experiment. At the moment there are only 2 experiments available that can be run:

```bash
guardoni-cli 1
```

**NB:** if you need to enable the debug output while running guardoni you can use `DEBUG=@trex* guardoni-cli ...`

## Build

In this project there are two different package that you can build: the `cli` package and the executable `electron` app.

Before running the proper script to build the package for your needs be sure you also run `yarn build`

### Package

To produce a valid executable just run:

```bash
yarn pkg
```

### Electron

A portable version of guardoni with a simple UI that provides configuration for the cli command is provided by Electron.
It uses `docker` and `electron-builder` to produce the distributable packages for the community:

```sh
# preliminary step that build electron-builder docker image compatible with node 16
cd ../
yarn docker-build
cd guardoni
yarn dist
```

### Development

For app development, the code needs to be compiled with `webpack` to produce a valid js, that can be start with `electron`.
Two handy commands are already in place:

```sh
# runs webpack
yarn watch
```

then, in another terminal pane:

```sh
# runs electron in reload mode
yarn reload
```

**Debug**: A debug task is defined for VSCode inside `.vscode/launch.json` named "Debug Guardoni Electron Main".

## FAQs

### Guardoni folder, what's about?

_How to run your own algorithm accountability experiment?_

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
