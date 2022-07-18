import axiosMock from '../__mocks__/axios.mock';
import { puppeteerMock, pageMock } from '../__mocks__/puppeteer.mock';
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
import { fc } from '@shared/test';

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
    hooks: {
      beforeWait: [
        {
          type: 'SCROLL_FOR',
          options: {
            deltaY: 400,
            total: 1000,
          },
        },
      ],
    },
  },
];

const ytBackend = process.env.YT_BACKEND as string;
const tkBackend = process.env.TK_BACKEND as string;

describe('Guardoni', () => {
  const basePath = path.resolve(__dirname, '../');
  const profile = 'profile-test-99';
  const emptyCSVTestFileName = 'yt-videos-test-empty.csv';
  const csvTestFileName = 'trex-yt-videos.csv';
  const keys = {
    publicKey: process.env.PUBLIC_KEY,
    secretKey: process.env.SECRET_KEY,
  };
  const defaultConfig = {
    headless: false,
    verbose: true,
    tosAccepted: undefined,
    ...keys,
    profileName: profile,
    researchTag: 'test-tag',
    advScreenshotDir: undefined,
    excludeURLTag: undefined,
    loadFor: 3000,
    basePath,
    chromePath: '/chrome/path',
    yt: {
      name: 'youtube' as const,
      backend: ytBackend,
      frontend: process.env.YT_FRONTEND as string,
      extensionDir: path.resolve(basePath, '../yttrex/extension/build'),
      proxy: undefined,
    },
    tk: {
      name: 'tiktok' as const,
      backend: tkBackend,
      frontend: process.env.TK_FRONTEND as string,
      extensionDir: path.resolve(basePath, '../tktrex/extension/build'),
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
    const profileDir = getProfileDataDir(basePath, profile);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, {
        recursive: true,
      });
    }

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
            extensionDir: path.join(basePath, '../tktrex/extension/build'),
          },
        },
      });
    });

    test('succeeds when no profile name is given but a profile dir exists', async () => {
      const g = await GetGuardoni({
        basePath,
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      }).launch(defaultConfig, 'youtube')();

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
      const result = await GetGuardoni({
        basePath,
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      }).run(
        {
          ...defaultConfig,
          headless: true,
          verbose: true,
          publicKey: undefined,
          secretKey: undefined,
          profileName,
        },
        'youtube'
      )();

      expect(result).toMatchObject({
        right: {
          config: {
            headless: true,
            verbose: true,
            yt: {
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
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      }).launch(defaultConfig, 'youtube');

      const experiment = await pipe(
        guardoni,
        TE.chain((g) =>
          pipe(
            g.registerExperimentFromCSV(
              path.resolve(basePath, 'experiments', emptyCSVTestFileName) as any
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

      axiosMock.request.mockResolvedValueOnce({
        data: {
          status: 'exist',
          experimentId: fc.sample(fc.uuid(), 1)[0],
          since: new Date().toISOString(),
        },
      });
      axiosMock.request.mockResolvedValueOnce({
        data: directiveLinks,
      });
      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: true,
        },
      });

      pageMock.waitForSelector.mockImplementation(() =>
        Promise.resolve(undefined)
      );
      pageMock.evaluateHandle.mockImplementation((fn) => {
        return Promise.resolve({
          asElement: () => ({
            press: jest.fn().mockResolvedValue(undefined),
            evaluate: jest.fn().mockResolvedValueOnce(1).mockResolvedValue(0),
          }),
        });
      });

      pageMock.$.mockResolvedValue(null);

      const guardoni = GetGuardoni({
        basePath,
        logger: guardoniLogger,
        puppeteer: puppeteerMock,
      }).launch(defaultConfig, 'youtube');

      const experiment = await pipe(
        guardoni,
        TE.chain((g) =>
          pipe(
            g.registerExperimentFromCSV(
              path.resolve(basePath, 'experiments', csvTestFileName) as any
            ),
            TE.chain((output) => g.runExperiment(output.values[0].experimentId))
          )
        )
      )();

      expect(experiment).toMatchObject({
        right: {
          message: 'Experiment completed',
          values: [
            {
              publicKey: keys.publicKey,
            },
          ],
        },
      });
    });
  });
});
