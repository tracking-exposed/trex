import * as fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { date } from 'io-ts-types';
import { GetLogger } from '../../logger';
import { v4 as uuid } from 'uuid';
import {
  markOutputField,
  GetParserProvider,
  ParserProviderContext,
  payloadToTableOutput,
  wrapDissector,
} from '../parser.provider';

const logger = GetLogger('parser-spec');

const db = {
  api: jest.fn(),
  read: jest.fn(),
  write: jest.fn(),
};

const homeParser = jest.fn();
const getContributions = jest.fn();
const buildMetadata = jest.fn();
const saveResults = jest.fn();

const NatureType = t.literal('home');

const Contribution = t.type(
  {
    id: t.string,
    type: NatureType,
    savingTime: date,
  },
  'Contribution'
);

const { savingTime, ...ContributionTypeProps } = Contribution.props;

const ContributionArb = getArbitrary(t.type({ ...ContributionTypeProps })).map(
  (c) => ({
    ...c,
    savingTime: new Date(),
  })
);

const Metadata = t.type({
  id: t.string,
  type: NatureType,
  nature: t.strict({
    type: NatureType,
  }),
  publicKey: t.string,
  savingTime: date,
});

const { savingTime: _savingTime, ...metadataProps } = Metadata.props;
const MetadataArb = getArbitrary(t.type({ ...metadataProps })).map((c) => {
  return {
    ...c,
    savingTime: new Date(),
  };
});

describe('Parser Provider', () => {
  const providerCtx: ParserProviderContext<
    typeof Contribution,
    typeof Metadata,
    any
  > = {
    db: db as any,
    parsers: {
      home: homeParser,
    },
    codecs: {
      contribution: Contribution,
      metadata: Metadata,
    },
    getContributions,
    getEntryId: (e) => e.id,
    getEntryNatureType(e) {
      return e.type;
    },
    getEntryDate(e) {
      return e.savingTime;
    },
    buildMetadata,
    saveResults: saveResults,
  };

  afterEach(() => {
    homeParser.mockClear();
    getContributions.mockClear();
    buildMetadata.mockClear();
    saveResults.mockClear();
  });

  test('printOutput: succeeds with valid values in table', async () => {
    const source = fc.sample(ContributionArb, 1)[0];
    const metadata = fc.sample(MetadataArb, 1)[0];
    const findings = {
      home: {
        type: 'home',
      },
    };
    const log = { home: 1 };
    const output = payloadToTableOutput<
      typeof Contribution,
      typeof Metadata,
      { [key: string]: any }
    >(
      (s) => s.id,
      [
        {
          source,
          findings,
          failures: {},
          log,
          metadata,
        },
      ]
    );

    expect(output).toMatchObject({
      [source.id]: {
        findings: markOutputField(findings),
        metadata: metadata.id,
      },
    });
  });

  test('wrapDissector: fails when parser throw an error', async () => {
    const [source] = fc.sample(ContributionArb, 1);

    const envelop = {
      source,
      findings: {},
      failures: {},
      log: {},
    };

    const parserError = new Error('The nature is missing');
    const dissectorFn = jest.fn().mockImplementation(() => {
      throw parserError;
    });

    const dissectorName = 'home';

    const result = await wrapDissector({ ...providerCtx, log: logger })(
      dissectorFn,
      dissectorName,
      source,
      envelop
    );

    expect(result).toMatchObject({
      failures: {
        home: parserError,
      },
      source,
      log: {
        home: '!E',
      },
    });

    // ensure envelop isn't mutate
    expect(envelop).toMatchObject({
      source,
      findings: {},
      failures: {},
      log: {},
    });
  });

  const parserProvider = GetParserProvider('test-parser', providerCtx);

  test('GetParserProvider: succeeds with single execution', async () => {
    const sources = fc.sample(ContributionArb, 1);

    getContributions.mockResolvedValueOnce({
      supporter: {},
      sources,
    });

    const homeFindings = {
      nature: {
        type: 'home',
      },
      type: 'home',
    };

    homeParser.mockResolvedValueOnce(homeFindings);

    const metadata = {
      id: uuid(),
      ...homeFindings,
    };

    buildMetadata.mockReturnValue(metadata);
    saveResults.mockResolvedValueOnce({
      metadata,
      source: sources[0],
      count: {
        home: 1,
      },
    });

    const result = await parserProvider.run({
      repeat: false,
      stop: 1,
      singleUse: true,
      htmlAmount: 1,
      backInTime: 0,
    });

    expect(homeParser).toHaveBeenCalledWith(sources[0], {});

    expect(saveResults).toHaveBeenCalledWith(sources[0], metadata);

    expect(result).toMatchObject({
      type: 'Success',
      payload: [
        {
          source: sources[0],
          metadata: metadata,
        },
      ],
    });
  });

  test('GetParserProvider: succeeds with correct logs count', async () => {
    const sourcesLength = 10;
    const sources = fc.sample(ContributionArb, sourcesLength);

    getContributions.mockResolvedValueOnce({
      supporter: {},
      sources,
    });

    const homeFindings = {
      nature: {
        type: 'home',
      },
      type: 'home',
    };

    homeParser.mockReturnValue(homeFindings);

    const metadata = {
      id: uuid(),
      ...homeFindings,
    };

    buildMetadata.mockReturnValue(metadata);

    saveResults.mockImplementation((s, m) =>
      Promise.resolve({
        metadata: m,
        source: s,
        count: {
          home: 1,
        },
      })
    );

    const result = await parserProvider.run({
      htmlAmount: sourcesLength,
      repeat: false,
      stop: 1,
      singleUse: true,
      backInTime: 0,
    });

    expect(result).toMatchObject({
      type: 'Success',
      payload: sources.map((s) => ({
        source: s,
        metadata: metadata,
      })),
    });
  });
});
