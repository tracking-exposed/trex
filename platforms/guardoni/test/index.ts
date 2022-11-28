import { Logger, trexLogger } from '@shared/logger';
import * as tests from '@shared/test';
import * as fs from 'fs';
import * as path from 'path';
import { getProfileDataDir } from '../src/guardoni/profile';
import { v4 as uuid } from 'uuid';

export interface Tests {
  fc: typeof tests.fc;
  logger: Logger;
  basePath: string;
  profileName: string;
  profileDir: string;
  ytExtensionDir: string;
  tkExtensionDir: string;
  publicKey: string;
  secretKey: string;
  afterAll: () => void;
}
export const GetTests = (profileName?: string): Tests => {
  const logger = trexLogger.extend('test');

  const profile = profileName ?? `profile-test-${uuid()}`;

  const basePath = process.env.BASE_PATH ?? path.resolve(__dirname, '../');
  const profileDir = getProfileDataDir(basePath, profile);
  const ytExtensionDir = path.resolve(basePath, '../yttrex/extension/build');
  const tkExtensionDir = path.resolve(basePath, '../tktrex/extension/build');
  const publicKey = process.env.PUBLIC_KEY as string;
  const secretKey = process.env.SECRET_KEY as string;

  fs.mkdirSync(path.resolve(basePath, 'experiments'), {
    recursive: true,
  });

  fs.statSync(ytExtensionDir, { throwIfNoEntry: true });
  fs.statSync(tkExtensionDir, { throwIfNoEntry: true });

  const afterAll = (): void => {
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, {
        recursive: true,
      });
    }
  };

  return {
    ...tests,
    logger,
    basePath,
    profileName: profile,
    profileDir,
    ytExtensionDir,
    tkExtensionDir,
    publicKey,
    secretKey,
    afterAll,
  };
};
