import axiosMock from '../../test/__mocks__/axios.mock';
import fetchMock from 'jest-fetch-mock';

process.env.API_ROOT = 'http://localhost:9001/api';
process.env.VERSION = '99';
process.env.FLUSH_INTERVAL = '4500';
process.env.BUILD = new Date().toISOString();

import { HandshakeActiveResponseArb } from '../../arbitraries/HandshakeResponse.arb';
import { MakeAPIClient } from '../../providers/api.provider';
import { fc } from '../../test';
import { boot, BootOpts } from '../app';
import { Hub } from '../hub';
import UserSettings from '../models/UserSettings';
import { getChromeMock } from '../__mocks__/chrome';
import * as t from 'io-ts';
import { DocumentedEndpoint } from '../../endpoints';
import { initializeKey } from '../chrome/background/account';

const appHub = new Hub();

// define a dummy header
const Headers = t.type(
  {
    'X-Authentication': t.string,
  },
  'Headers'
);

// define a sample api client with mocked endpoints for handshake and events submission
const api = MakeAPIClient(
  {
    baseURL: process.env.API_ROOT,
    getAuth: async (req) => req,
    onUnauthorized: async (res) => res,
  },
  {
    v2: {
      Public: {
        Handshake: DocumentedEndpoint({
          title: 'Handshake',
          description: 'A mock endpoint for client-server hanshake',
          Method: 'POST',
          getPath: () => `/handshake`,
          Input: {
            Headers: undefined,
            Params: undefined,
            Query: undefined,
            Body: t.any,
          },
          Output: t.any,
          tags: [],
        }),
        AddEvents: DocumentedEndpoint({
          title: 'Add events',
          description: 'A mock endpoint for events sending',
          Method: 'POST',
          getPath: () => `/events`,
          Input: {
            Headers,
            Params: undefined,
            Query: undefined,
            Body: t.any,
          },
          Output: t.any,
          tags: [],
        }),
        AddAPIEvents: DocumentedEndpoint({
          title: 'Add API events',
          description: 'A mock endpoint for api events',
          Method: 'POST',
          getPath: () => `/events-api`,
          Input: {
            Headers,
            Params: undefined,
            Query: undefined,
            Body: t.any,
          },
          Output: t.any,
          tags: [],
        }),
      },
    },
  }
);

const researchTag = 'test-research-tag';

const getConfig = (): UserSettings => ({
  active: true,
  ux: true,
  publicKey: undefined as any,
  secretKey: undefined as any,
  researchTag,
  experimentId: undefined,
});

const onRegisterMock = jest.fn();
const getHeadersForDataDonationMock = jest.fn();

const { chrome, clearDB } = getChromeMock({
  backgroundOpts: {
    api: api.API,
    getHeadersForDataDonation: getHeadersForDataDonationMock,
  },
});

const { publicKey, secretKey, ...config } = getConfig();

const bootOptions: BootOpts = {
  payload: {
    ...config,
    href: window.location.href,
  } as any,
  mapLocalConfig: (settings, payload) => ({
    ...settings,
    ...payload,
  }),
  observe: {
    handlers: {},
    platformMatch: new RegExp('.+'),
    onLocationChange: () => {},
  },
  hub: {
    hub: appHub,
    onRegister: onRegisterMock,
  },
  onAuthenticated: (req) => req,
};

describe('App', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    clearDB();
  });

  afterAll(() => {
    fetchMock.disableMocks();
  });

  test('Succeeds when settings.json is not present', async () => {
    const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];
    axiosMock.request.mockResolvedValueOnce({ data: handshakeResponse });
    chrome.runtime.getURL.mockReturnValueOnce('file://settings.json');
    fetchMock.mockResponseOnce(JSON.stringify({}));
    chrome.runtime.getURL.mockReturnValueOnce('file://experiment.json');
    fetchMock.mockResponseOnce(JSON.stringify({}));

    const app = await boot(bootOptions);

    const expectedConfig = {
      ...config,
      researchTag,
      href: 'http://localhost/',
      publicKey: app.config.publicKey,
      secretKey: app.config.secretKey,
    };

    expect(app.config).toMatchObject(expectedConfig);
    expect(app.config.publicKey.length).toBeGreaterThanOrEqual(43);
    expect(app.config.secretKey.length).toBeGreaterThanOrEqual(86);
    expect(onRegisterMock).toHaveBeenCalledWith(appHub, expectedConfig);
  });

  test('Succeeds when settings.json is present', async () => {
    const keys = initializeKey();
    const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];

    chrome.runtime.getURL.mockReturnValueOnce('file://settings.json');
    fetchMock.mockResponseOnce(JSON.stringify(keys));
    chrome.runtime.getURL.mockReturnValueOnce('file://experiment.json');
    fetchMock.mockResponseOnce(JSON.stringify({}));

    getHeadersForDataDonationMock.mockResolvedValueOnce({
      'X-Authentication': keys.publicKey,
    });

    axiosMock.request.mockResolvedValueOnce({ data: handshakeResponse });

    const app = await boot(bootOptions);

    const expectedConfig = {
      ...getConfig(),
      ...keys,
      href: 'http://localhost/',
    };

    expect(app.config).toMatchObject(expectedConfig);
    expect(onRegisterMock).toHaveBeenCalledWith(appHub, expectedConfig);
  });
});
