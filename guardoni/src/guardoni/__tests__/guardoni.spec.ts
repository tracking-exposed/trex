/* eslint-disable import/first */
jest.mock('axios');
jest.mock('puppeteer-core');
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { guardoniLogger } from '../../logger';
import { getDefaultProfile, GetGuardoni, getProfileDataDir } from '../guardoni';

const axiosMock = axios as jest.Mocked<typeof axios>;
axiosMock.create.mockImplementation(() => axiosMock);

describe('Guardoni', () => {
  const basePath = path.resolve(__dirname, '../../../');
  const profile = 'profile-test-99';
  const extensionDir = path.resolve(__dirname, '../../../build/extension');

  describe('config', () => {
    beforeAll(() => {
      const profileUDD = getProfileDataDir(basePath, profile);
      const profileExists = fs.statSync(profileUDD, {
        throwIfNoEntry: false,
      });

      if (!profileExists) {
        fs.mkdirSync(profileUDD, {
          recursive: true,
        });
      }
      fs.writeFileSync(
        path.join(profileUDD, 'guardoni.json'),
        JSON.stringify(
          getDefaultProfile(basePath, profile, extensionDir),
          null,
          2
        ),
        'utf-8'
      );
    });

    afterAll(() => {
      fs.rmdirSync(getProfileDataDir(basePath, profile), { recursive: true });
    });

    test('succeeds when no profile name is given but a profile dir exists', async () => {
      const g = await GetGuardoni({
        config: { headless: false, verbose: false, basePath },
        logger: guardoniLogger,
      })();

      expect(g).toMatchObject({
        right: {
          config: {
            profileName: profile,
          },
        },
      });
    });

    test('succeeds with correct defaults', async () => {
      const profileName = 'profile-test-0';
      const backend = 'http://localhost:9000/api';
      const g = await GetGuardoni({
        config: {
          headless: false,
          verbose: false,
          basePath,
          profileName,
          backend,
        },
        logger: guardoniLogger,
      })();

      expect(g).toMatchObject({
        right: {
          config: {
            headless: false,
            verbose: false,
            backend,
            profileName,
            extensionDir: path.join(basePath, 'build/extension'),
          },
        },
      });
    });
  });
});
