#!/usr/bin/env node

import { $ } from 'zx';

// set -e -x

const version = await $`node -p -e "require('./package.json').version"`;
const cliFlags = [
  '--verbose',
  '--headless=false',
  '--basePath=./',
  '-c=guardoni.config.json',
];
const cli = `./dist/guardoni-cli-${version.stdout.replace('\n', '')}-linux`;

// TK

void (async function () {
  // register an experiment for search
  const tk_search_experiment_register_out =
    await $`(${cli} ${cliFlags} tk-register ./experiments/tk-search.csv | grep 'experimentId: ')`;
  const tk_search_experiment_id =
    tk_search_experiment_register_out.stdout.replace('experimentId: \t ', '');

  // # echo $tk_search_experiment_id

  // # exec the experiment
  const tk_search_experiment_run_out =
    await $`(${cli} ${cliFlags} tk-experiment ${tk_search_experiment_id} |  grep 'publicKey:')`;

  const tk_search_experiment_public_key =
    tk_search_experiment_run_out.stdout.replace('publicKey: ', '');

  await $`echo ${tk_search_experiment_public_key}`;

  await $`curl http://localhost:14000/api/v1/personal/${tk_search_experiment_public_key}/search/json`;

  // #register an experiment for videos
  const tk_video_experiment_register_out =
    await $`(${cli} ${cliFlags} tk-register ./experiments/tk-videos.csv | grep 'experimentId:')`;
  const tk_video_experiment_id = tk_video_experiment_register_out.stdout
    .replace('experimentId: \t ', '')
    .replace('\n', '');

  // # echo $tk_video_experiment_id

  // # exec the experiment
  const tk_video_experiment_run_out =
    await $`(${cli} ${cliFlags} tk-experiment ${tk_video_experiment_id} |  grep 'publicKey:')`;

  const tk_video_experiment_public_key =
    tk_video_experiment_run_out.stdout.replace('publicKey: \t ', '');
  await $`echo ${tk_video_experiment_public_key}`;
})();