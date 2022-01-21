/* eslint-disable import/first */
import * as fs from 'fs';
import * as path from 'path';
import { pipe } from 'fp-ts/lib/function';
import { guardoniLogger } from '../../logger';
import { getDefaultProfile, GetGuardoni, getProfileDataDir } from '../guardoni';
import * as TE from 'fp-ts/lib/TaskEither';
import { csvStringifyTE } from '../utils';

const directives = [
  {
    title: 'YouChoose: Customize your Recommendations',
    url: 'https://www.youtube.com/watch?v=3laqegktOuQ',
    urltag: 'youchoose-recommendations',
    watchFor: '3s',
  },
  {
    title: 'YouChoose.ai | Gain Control on your Recommendations!',
    url: 'https://www.youtube.com/watch?v=ReVMTcRA-E4',
    urltag: 'youchose-gain-Control',
    watchFor: '3s',
  },
  {
    title:
      'with Tracking Exposed: knowledge is freedom — algorithm analysis is for anybody!',
    url: 'https://www.youtube.com/watch?v=SmYuYEhT81c',
    urltag: 'trex-algorithm',
    watchFor: '5s',
  },
];

const backend = process.env.BACKEND;

describe.skip('Guardoni', () => {
  const basePath = path.resolve(__dirname, '../../../');
  const profile = 'profile-test-99';
  const extensionDir = path.resolve(__dirname, '../../../build/extension');
  const csvTestFileName = 'trex-yt-videos.csv';

  beforeAll(async () => {
    const csvContent = await csvStringifyTE(directives, {
      header: true,
      encoding: 'utf-8',
    })();
    if (csvContent._tag === 'Left') {
      throw csvContent.left as any;
    }
    fs.writeFileSync(
      path.resolve(basePath, 'experiments', csvTestFileName),
      csvContent.right,
      'utf-8'
    );

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

  describe('config', () => {
    test('succeeds when no profile name is given but a profile dir exists', async () => {
      const g = await GetGuardoni({
        config: { headless: false, verbose: false, basePath, backend },
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

  describe('experiment', () => {
    test('succeeds when run an experiment from an already existing directive', async () => {
      // one minute
      jest.setTimeout(60 * 1000);

      const guardoni = GetGuardoni({
        config: {
          verbose: true,
          headless: true,
        },
        logger: guardoniLogger,
      });

      const experiment = await pipe(
        guardoni,
        TE.chain((g) =>
          pipe(
            g.registerExperimentFromCSV(
              path.resolve(basePath, 'experiments', csvTestFileName) as any,
              'comparison'
            ),
            TE.chain((output) => g.runExperiment(output.values.experimentId))
          )
        )
      )();

      expect(experiment).toMatchObject({
        right: {
          message: 'Experiment completed',
        },
      });
    });
  });
});
