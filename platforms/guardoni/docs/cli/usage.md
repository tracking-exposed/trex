---
title: Usage
sidebar_position: 2
---

```bash

guardoni-cli <command>

Commands:
  guardoni-cli yt-navigate                 Use guardoni browser with loaded yt e
                                           xtension
  guardoni-cli yt-experiment <experiment>  Run guardoni from a given experiment
  guardoni-cli yt-register <file>          Register an experiment from a CSV
  guardoni-cli yt-list                     List available experiments
  guardoni-cli yt-auto <index>             YT automatic mode
  guardoni-cli tk-navigate                 Use guardoni browser with loaded tk e
                                           xtension
  guardoni-cli tk-experiment <experiment>  Run guardoni from a given experiment
  guardoni-cli tk-register <file>          Register an experiment from a CSV
  guardoni-cli tk-list                     List available experiments
  guardoni-cli tk-init [projectDirectory]  Initialize an experiment directory
  guardoni-cli tk-run [projectDirectory]   Run an experiment from a directory pr
                                           eviously initialized
  guardoni-cli tk-dump [projectDirectory]  Dump meta data from an experiment dir
                                           ectory

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -c, --config              Path to JSON config file
                                      [string] [default: "guardoni.config.json"]
      --headless            Run guardoni in headless mode.
                                                      [boolean] [default: false]
      --researchTag         The evidence related tag.                   [string]
      --profile             The current user profile                    [string]
      --backend             The API endpoint for server requests        [string]
      --proxy               Socket proxy for puppeteer.                 [string]
      --adv-screenshot-dir  ADV screenshot directory path               [string]
  -v, --verbose             Produce tons of logs      [boolean] [default: false]

Not enough non-option arguments: got 0, need at least 1
```

## Configuration

By default, the CLI loads the content of `guardoni.config.json` when is present, but the specific keys can be overridden by arguments.

```bash
./guardoni-cli --basePath ~/.guardoni2 --verbose yt-list
```

## Commands

Commands are now organized per-platform and so they're prefixed with a shortname of the platforms we suppport, e.g. `yt-list`, `tk-experiment`.

Once the command is invoked, _Guardoni_ will read the configuration, extract the specific platform configuration and use it.

### Register an experiment

In order to add a new experiment, prepare your csv with the proper entries and use `yt-register` to send it to the API and create the entry.

```bash
./guardoni-cli yt-register ./experiments/yt-home.csv

# output

Register-csv succeeded: Experiment created successfully


Output values:

status:          created
experimentId:    d659fc7852b7a2878387773231054d534976bb12
since:

```

### List an experiment

```bash
./guardoni-cli yt-list

# output

List succeeded: Public Experiments Available

when:           2022-05-27T11:50:02.423Z
experimentId:   d659fc7852b7a2878387773231054d534976bb12
steps:
         title:          Yt Home
         url:    https://www.youtube.com/
         urltag:         youtube home
         watchFor:       42000
```

### Running an experiment

```bash
guardoni-cli yt-experiment d659fc7852b7a2878387773231054d534976bb12

# output

Experiment succeeded: Experiment completed


Output values:

experimentId:    d659fc7852b7a2878387773231054d534976bb12
researchTag:     no-tag-25368
execCount:       3
profileName:     profile-test-99
newProfile:      false
when:

publicKey:       XXX-your-public-key-XXX

```
