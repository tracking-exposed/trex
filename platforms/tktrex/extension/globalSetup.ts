// global-setup.js
import { setup as setupDevServer } from 'jest-dev-server';
// import * as path from 'path';

export default async function globalSetup(): Promise<void> {
  // const currentDirCommand = path.resolve(`${__dirname}`, '../../../');

  await setupDevServer([
    {
      command: 'yarn tk:backend start --key test --port 14001',
      launchTimeout: 20000,
      port: 14001,
      usedPortAction: 'ignore',
    },
    {
      command: 'yarn tk:backend parserv',
      launchTimeout: 5000,
    },
  ]).catch((e) => {
    console.error(e);
  });

  // Your global setup
}
