#!/usr/bin/env node
/* eslint-disable camelcase */

import { $ } from 'zx';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });
process.env.NODE_ENV = 'development';

// eslint-disable-next-line no-void
void (async function () {
  await $`yarn clean`;
  await $`yarn yt:ext build:guardoni`;
  await $`yarn tk:ext build:guardoni`;

  await $`yarn build:cli`;
  await $`yarn pkg`;
})();
