// global-setup.js
import { setup as setupDevServer } from 'jest-dev-server';

export default async function globalSetup(): Promise<void> {
  await setupDevServer([
    {
      command: `yarn yt:backend watch --port=9001`,
      launchTimeout: 20000,
      port: 9001,
      usedPortAction: 'ignore',
    },
    // {
    //   command: `yarn yt:backend parserv`,
    //   launchTimeout: 5000,
    // },
    // {
    //   command: `yarn yt:backend leaveserv`,
    //   launchTimeout: 5000,
    // },
  ]);

  // Your global setup
}
