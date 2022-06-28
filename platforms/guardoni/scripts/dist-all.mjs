#!/usr/bin/env node

import { $, os } from 'zx';
import { normalizePlatform } from './utils.mjs';

process.env.NODE_ENV = 'development';

void (async function () {
  const platform = normalizePlatform(os.type());
  await $`echo ${platform}`;

  await $`yarn guardoni build:app`;
  await $`yarn dist:${platform}`;
})();
