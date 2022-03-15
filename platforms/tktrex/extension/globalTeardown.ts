import { teardown as teardownServer } from 'jest-dev-server';

export default async function globalSetup(): Promise<void> {
  await teardownServer();
};
