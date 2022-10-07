#!/usr/bin/env node
/* eslint-disable camelcase */

import { $, os, fetch, path, fs } from 'zx';
import { normalizePlatform, getGuardoniCliPkgName } from './utils.mjs';
import dotenv from 'dotenv';
import assert from 'assert';

dotenv.config({ path: '.env.development' });

// eslint-disable-next-line no-void
void (async function () {
  const version = await $`node -p -e "require('./package.json').version"`;
  const platform = normalizePlatform(os.type());
  const profile = 'profile-test-99';

  fs.removeSync(path.resolve(process.cwd(), 'profiles', profile));

  const cli = `./dist/${getGuardoniCliPkgName(
    version.stdout.replace('\n', ''),
    platform
  )}`;
  const flags = [
    '--basePath=./',
    `--executablePath=${process.env.PUPPETEER_EXEC_PATH}`,
    '-c=guardoni.config.json',
    '--headless=false',
    '--verbose',
  ];

  const researchTag = 'cli-yt-test-videos';
  const experimentFlags = [
    ...flags,
    `--publicKey=${process.env.PUBLIC_KEY}`,
    `--secretKey=${process.env.SECRET_KEY}`,
    `--researchTag=${researchTag}`
  ];

  // reject cookie modal
  await $`${cli} ${flags} yt-navigate --cookie-modal=reject --exit --headless=false`

  // // register an experiment for videos
  const yt_video_experiment_register_out =
    await $`${cli} ${flags} yt-register ./experiments/yt-videos.csv | grep 'experimentId: '`;
  const yt_video_experiment_id = yt_video_experiment_register_out.stdout
    .replace('experimentId: \t ', '')
    .replace('\n', '');

  await $`echo ${yt_video_experiment_id}`;

  // exec the experiment
  const ytVideoExperimentRunOut =
    await $`(${cli} ${experimentFlags} yt-experiment ${yt_video_experiment_id} | grep 'publicKey: ')`;

  await $`echo ${ytVideoExperimentRunOut}`;

  const ytVideoExperimentPubKey = ytVideoExperimentRunOut.stdout
    .replace('publicKey: \t ', '')
    .replace('\n', '');

  // assert.strictEqual(ytVideoExperimentPubKey, process.env.PUBLIC_KEY);

  const metadata = await fetch(
    `http://localhost:9000/api/v2/metadata?experimentId=${yt_video_experiment_id}`
  ).then((r) => r.json());

  assert.strictEqual(metadata[0].experimentId, yt_video_experiment_id);
  assert.strictEqual(metadata[0].type, 'video');
  assert.strictEqual(metadata[1].experimentId, yt_video_experiment_id);
  assert.strictEqual(metadata[1].type, 'video');
  assert.strictEqual(metadata[2].experimentId, yt_video_experiment_id);
  assert.strictEqual(metadata[2].type, 'video');
})();
