#!/usr/bin/env node

import { $, os } from 'zx';
import { normalizePlatform, getGuardoniCliPkgName } from  './utils.mjs';

void (async function () {
  
  const version = await $`node -p -e "require('./package.json').version"`;
  const platform = normalizePlatform(os.type());
  const cli = `./dist/${getGuardoniCliPkgName(
    version.stdout.replace('\n', ''),
    platform
  )}`;
  const flags = [
    '--basePath=./',
    '-c=guardoni.config.json',
    '--headless',
    '--verbose',
  ];

  const yt_home_experiment_register_out =
    await $`${cli} ${flags}  yt-register ./experiments/yt-home.csv | grep 'experimentId: '`;

  const yt_home_experiment_id = yt_home_experiment_register_out.stdout.replace(
    'experimentId: \t ',
    ''
  );

  await $`echo "home experiment id: ${yt_home_experiment_id}"`;

  // exec the experiment
  const yt_home_experiment_run_out =
    await $`${cli} ${flags} yt-experiment ${yt_home_experiment_id} | grep 'publicKey: ' `;

  await $`echo "${yt_home_experiment_run_out}"`;

  const yt_home_experiment_public_key = yt_home_experiment_run_out.stdout
    .replace('publicKey: \t ', '')
    .replace('\n', '');

  await $`echo ${yt_home_experiment_public_key}`;
  await $`curl "http://localhost:9000/api/v1/personal/${yt_home_experiment_public_key}"`;

  // // register an experiment for videos
  const yt_video_experiment_register_out =
    await $`${cli} ${flags} yt-register ./experiments/yt-videos.csv | grep 'experimentId: '`;
  const yt_video_experiment_id =
    yt_video_experiment_register_out.stdout.replace('experimentId: \t ', '');

  await $`echo ${yt_video_experiment_id}`;

  // exec the experiment
  let ytVideoExperimentRunOut =
    await $`(${cli} ${flags} yt-experiment ${yt_video_experiment_id} | grep 'publicKey: ')`;

  await $`echo ${ytVideoExperimentRunOut}`;

  const ytVideoExperimentPubKey = ytVideoExperimentRunOut.stdout
    .replace('publicKey: \t ', '')
    .replace('\n', '');

  await $`curl "http://localhost:9000/api/v1/personal/${ytVideoExperimentPubKey}"`;
})();
