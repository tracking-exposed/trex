/* eslint-disable import/first */
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import * as path from 'path';
import { readConfigFromPath } from '../src/guardoni/config';
import { GetGuardoni } from '../src/guardoni/guardoni';
import { getDefaultProfile, getProfileDataDir } from '../src/guardoni/profile';
import { csvStringifyTE } from '../src/guardoni/utils';
import { guardoniLogger } from '../src/logger';
import { puppeteerMock } from '../__mocks__/puppeteer.mock';

const directiveLinks = [
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

const backend = process.env.YT_BACKEND as string;

describe('Guardoni', () => {
  const basePath = path.resolve(__dirname, '../');
  const profile = 'profile-test-99';
  const emptyCSVTestFileName = 'yt-videos-test-empty.csv';
  const csvTestFileName = 'trex-yt-videos.csv';
  const defaultConfig = {
    headless: false,
    verbose: false,
    profileName: profile,
    evidenceTag: '',
    advScreenshotDir: undefined,
    excludeURLTag: undefined,
    loadFor: 3000,
    basePath,
    yt: {
      name: 'youtube' as const,
      backend: process.env.YT_BACKEND as string,
      extensionDir: path.resolve(__dirname, '../../yttrex/extension/build'),
      proxy: undefined,
    },
    tk: {
      name: 'tiktok' as const,
      backend: process.env.TK_BACKEND as string,
      extensionDir: path.resolve(__dirname, '../../tktrex/extension/build'),
      proxy: undefined,
    },
  };

  beforeAll(async () => {
    const csvContent = await csvStringifyTE(directiveLinks, {
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
    const profileExists = fs.existsSync(profileUDD);

    if (!profileExists) {
      fs.mkdirSync(profileUDD, {
        recursive: true,
      });
    }
    fs.writeFileSync(
      path.join(profileUDD, 'guardoni.json'),
      JSON.stringify(getDefaultProfile(basePath, profile), null, 2),
      'utf-8'
    );
  });

  afterAll(() => {
    fs.rmdirSync(getProfileDataDir(basePath, profile), { recursive: true });
    fs.rmSync(path.resolve(basePath, 'experiments', csvTestFileName));
  });

  describe('config', () => {
    test('succeeds when config is correctly formed', async () => {
      const config = await readConfigFromPath({ logger: guardoniLogger })(
        basePath,
        defaultConfig
      )();

      expect(config).toMatchObject({
        right: {
          profileName: defaultConfig.profileName,
          verbose: defaultConfig.verbose,
          headless: defaultConfig.headless,
          yt: {
            name: 'youtube',
            backend: 'http://localhost:9000/api',
            extensionDir: path.resolve(basePath, '../yttrex/extension/build'),
          },
          tk: {
            name: 'tiktok',
            backend: 'http://localhost:14000/api',
            extensionDir: path.resolve(basePath, '../tktrex/extension/build'),
          },
        },
      });
    });

    test('succeeds when no profile name is given but a profile dir exists', async () => {
      const g = await GetGuardoni({
        basePath,
        config: defaultConfig,
        platform: 'youtube',
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      })();

      expect(g).toMatchObject({
        right: {
          config: {
            profileName: profile,
          },
        },
      });
    });

    test('succeeds with profile option', async () => {
      const profileName = 'profile-test-0';
      const g = await GetGuardoni({
        basePath,
        config: {
          ...defaultConfig,
          headless: true,
          verbose: true,
          profileName,
        },
        platform: 'youtube',
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      })();

      expect(g).toMatchObject({
        right: {
          config: {
            headless: true,
            verbose: true,
            platform: {
              backend: defaultConfig.yt.backend,
              extensionDir: defaultConfig.yt.extensionDir,
            },
            profileName,
          },
        },
      });
    });
  });

  describe('register experiment', () => {
    test('fails when the experiment has no links', async () => {
      // one minute
      jest.setTimeout(60 * 1000);

      const guardoni = GetGuardoni({
        basePath,
        config: defaultConfig,
        platform: 'youtube',
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      });

      const experiment = await pipe(
        guardoni,
        TE.chain((g) =>
          pipe(
            g.registerExperimentFromCSV(
              path.resolve(
                basePath,
                'experiments',
                emptyCSVTestFileName
              ) as any,
              'comparison'
            )
          )
        )
      )();

      expect(experiment).toMatchObject({
        left: {
          message: "Can't create an experiment with no links",
        },
      });
    });
  });

  describe('experiment', () => {
    test('succeeds when run an experiment from an already existing directive', async () => {
      // one minute
      jest.setTimeout(60 * 1000);

      const guardoni = GetGuardoni({
        basePath,
        config: defaultConfig,
        platform: 'youtube',
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      });

      const experiment = await pipe(
        guardoni,
        TE.chain((g) =>
          pipe(
            g.registerExperimentFromCSV(
              path.resolve(basePath, 'experiments', csvTestFileName) as any,
              'comparison'
            ),
            TE.chain((output) => g.runExperiment(output.values[0].experimentId))
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
