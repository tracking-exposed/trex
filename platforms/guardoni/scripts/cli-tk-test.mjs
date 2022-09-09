#!/usr/bin/env node
/* eslint-disable camelcase */

import { $, fs, path, fetch } from 'zx';
import dotenv from 'dotenv';
import assert from 'assert';

dotenv.config({ path: '.env.development' });

const version = await $`node -p -e "require('./package.json').version"`;

try {
  const response = await fetch('http://localhost:14000/api/v0/health');
  const isRunning = await response.text();
  if (isRunning !== 'OK') {
    throw new Error();
  }
  console.log('\x1b[33mbackend running!\x1b[0m');
} catch (e) {
  console.log('backend not running? run:');
  console.log('\x1b[33m$ yarn pm2 start platforms/ecosystem.config.js \x1b[0m');
  process.exit(1);
}

const profile = 'profile-test-99';

const cliFlags = [
  '--verbose',
  '--headless=false',
  '--basePath=./',
  '-c=guardoni.config.json',
];
const experimentCLIFlags = [
  ...cliFlags,
  `--publicKey=${process.env.PUBLIC_KEY}`,
  `--secretKey=${process.env.SECRET_KEY}`,
];
const cli = `./dist/guardoni-cli-${version.stdout.replace('\n', '')}-linux`;

// TK

// eslint-disable-next-line no-void
void (async function () {
  fs.removeSync(path.resolve(process.cwd(), 'profiles', profile));

  // register an experiment for search
  const tk_search_experiment_register_out =
    await $`(${cli} ${cliFlags} tk-register ./experiments/tk-search.csv | grep 'experimentId: ')`;
  const tk_search_experiment_id =
    tk_search_experiment_register_out.stdout.replace('experimentId: \t ', '');

  await $`echo ${tk_search_experiment_id}`;

  // reject cookie modal
  await $`${cli} ${cliFlags} tk-navigate --cookie-modal=reject --headless=false`;

  // # exec the experiment
  const tk_search_experiment_run_out =
    await $`(${cli} ${experimentCLIFlags} tk-experiment ${tk_search_experiment_id} |  grep 'publicKey:')`;

  const tk_search_experiment_public_key = tk_search_experiment_run_out.stdout
    .replace('publicKey: \t', '')
    .replace('\n', '');

  await $`echo ${tk_search_experiment_public_key}`;

  // check publicKey match when given as env variable

  assert.strictEqual(tk_search_experiment_public_key, process.env.PUBLIC_KEY);

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
    await $`(${cli} ${experimentCLIFlags} tk-experiment ${tk_video_experiment_id} |  grep 'publicKey:')`;

  const tk_video_experiment_public_key =
    tk_video_experiment_run_out.stdout.replace('publicKey: \t ', '');
  await $`echo ${tk_video_experiment_public_key}`;
})();
