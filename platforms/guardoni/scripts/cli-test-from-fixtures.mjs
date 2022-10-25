#!/usr/bin/env node

/* eslint-disable camelcase */

import { $, os, fetch, fs, path } from 'zx';
import { normalizePlatform, getGuardoniCliPkgName } from './utils.mjs';
import dotenv from 'dotenv';
import assert from 'assert';
import {
  readFixtureJSONPaths,
  readFixtureJSON,
} from '../../../packages/shared/build/test/utils/parser.utils.js';
import { csvStringifyTE } from '../../../packages/shared/build/utils/csv.utils.js';
import { foldTEOrThrow } from '../../../packages/shared/build/utils/fp.utils.js';

dotenv.config({ path: '.env.development' });

// eslint-disable-next-line no-void
void (async function () {
  const [p, nature, count] = process.argv.slice(2);
  console.log({ p, nature, count });

  if (!p) {
    console.error('Platform parameter not present');
    process.exit(1);
  }

  if (!nature) {
    console.error('Nature parameter not present');
    process.exit(1);
  }

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

  const researchTag = `guardoni-${p}-test-${nature}`;

  const experimentFlags = [
    ...flags,
    `--publicKey=${process.env.PUBLIC_KEY}`,
    `--secretKey=${process.env.SECRET_KEY}`,
    `--researchTag=${researchTag}`,
  ];

  const fixturePaths = readFixtureJSONPaths(
    path.resolve(
      process.cwd(),
      `../${p}trex/backend/__tests__/fixtures/htmls/${nature}`
    )
  );

  const take = parseInt(count, 10) ?? fixturePaths.length;
  await $`echo "Taking ${take} fixtures"`;
  const fixtures = fixturePaths
    .slice(0, take)
    .map((f) => readFixtureJSON(f, process.env.PUBLIC_KEY));

  const sources = fixtures.reduce(
    (acc, f, i) =>
      acc.concat(
        f.sources.map((s, ii) => ({
          title: f.metadata.title,
          url: s.href,
          urltag: `${p}-test-${nature}-${i}-${ii}`,
          watchFor: '5s',
          incrementScrollByPX: 400,
          totalScroll: 1000,
        }))
      ),
    []
  );

  // reject cookie modal
  await $`${cli} ${flags} ${p}-navigate`;

  const experiment = await foldTEOrThrow(
    csvStringifyTE(sources, { header: 'true' })
  );

  const experimentFile = path.resolve(
    process.cwd(),
    `./experiments/${p}-${nature}-test-from-fixtures-temp.csv`
  );

  fs.writeFileSync(experimentFile, experiment, 'utf-8');

  const yt_home_experiment_register_out =
    await $`${cli} ${flags} ${p}-register ${experimentFile}`;

  const experiment_id = yt_home_experiment_register_out.stdout
    .split('\n')
    .find((s) => s.startsWith('experimentId:'))
    .replace('experimentId: \t', '')
    .trim();

  const yt_home_experiment_run_out =
    await $`${cli} ${experimentFlags} ${p}-experiment ${experiment_id} | grep 'publicKey: ' `;

  const supporter_public_key = yt_home_experiment_run_out.stdout
    .replace('publicKey: \t ', '')
    .replace('\n', '');

  assert.strictEqual(supporter_public_key, process.env.PUBLIC_KEY);

  const backend = p === 'tk' ? process.env.TK_BACKEND : process.env.YT_BACKEND;
  const personalURL = `${backend}/v2/personal/${supporter_public_key}/${nature}/json`;
  const metadataURL = `${backend}/v2/metadata?publicKey=${supporter_public_key}&experimentId=${experiment_id}&nature=${nature}`;

  await $`echo ${personalURL}`;
  await $`echo ${metadataURL}`;
  const metadata = await fetch(metadataURL).then((r) => r.json());

  assert.strictEqual(metadata.length, sources.length);
  assert.strictEqual(
    metadata.map((m) => ({
      experimentId: m.experimentId,
      type: m.type,
    })),
    Array.from({ length: sources.length }).map(() => ({
      experimentId: experiment_id,
      type: nature,
    }))
  );

  fs.removeSync(experimentFile);
})();
