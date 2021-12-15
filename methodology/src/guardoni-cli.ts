#!/usr/bin/env node

import * as guardoni from "./guardoni";

const [, ...args] = process.argv;

const run = async (): Promise<void> => {
  try {
    // eslint-disable-next-line no-console
    console.log(args);
    const manifest = guardoni.initialSetup();
    await guardoni.validateAndStart(manifest);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Guardoni failed with", e);
  }
};

void run();
