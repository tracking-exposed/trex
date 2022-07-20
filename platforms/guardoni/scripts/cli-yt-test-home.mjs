#!/usr/bin/env node
/* eslint-disable camelcase */

import { $, os, fetch } from 'zx';
import { normalizePlatform, getGuardoniCliPkgName } from './utils.mjs';
import dotenv from 'dotenv';
import assert from 'assert';

dotenv.config({ path: '.env.development' });

// eslint-disable-next-line no-void
void (async function () {
  const version = await $`node -p -e "require('./package.json').version"`;
  const platform = normalizePlatform(os.type());
  const cli = `./dist/${getGuardoniCliPkgName(
    version.stdout.replace('\n', ''),
    platform
  )}`;

  const flags = [
    '--basePath=./',
    `--executablePath=${process.env.PUPPETEER_EXEC_PATH}`,
    '-c=guardoni.config.json',
    '--headless',
    '--verbose',
  ];

  const researchTag = 'cli-yt-test-home';

  const experimentFlags = [
    ...flags,
    `--publicKey=${process.env.PUBLIC_KEY}`,
    `--secretKey=${process.env.SECRET_KEY}`,
    `--researchTag=${researchTag}`
  ];

  // reject cookie modal
  await $`${cli} ${flags} yt-navigate --cookie-modal=reject --exit --headless=false`;

  const yt_home_experiment_register_out =
    await $`${cli} ${flags}  yt-register ./experiments/yt-home.csv | grep 'experimentId: '`;

  const yt_home_experiment_id = yt_home_experiment_register_out.stdout
    .replace('experimentId: \t ', '')
    .replace('\n', '');

  await $`echo "home experiment id: ${yt_home_experiment_id}"`;

  // exec the experiment
  const yt_home_experiment_run_out =
    await $`${cli} ${experimentFlags} yt-experiment ${yt_home_experiment_id} | grep 'publicKey: ' `;

  await $`echo "${yt_home_experiment_run_out}"`;

  const yt_home_experiment_public_key = yt_home_experiment_run_out.stdout
    .replace('publicKey: \t ', '')
    .replace('\n', '');

  await $`echo ${yt_home_experiment_public_key}`;

  assert.strictEqual(yt_home_experiment_public_key, process.env.PUBLIC_KEY);
  const metadata = await fetch(
    `http://localhost:9000/api/v2/metadata?experimentId=${yt_home_experiment_id}`
  ).then((r) => r.json());

  assert.strictEqual(metadata[0].experimentId, yt_home_experiment_id);
  assert.strictEqual(metadata[0].researchTag, researchTag);
  assert.strictEqual(metadata[0].type, 'home');
})();
