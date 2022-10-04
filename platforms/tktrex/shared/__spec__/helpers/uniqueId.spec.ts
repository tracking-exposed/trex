import {
  getTimelineId,
  GetTimelineIdOpts,
  getHTMLId,
  GetUniqueIdOpts,
  TimelineId,
  getMetadataId,
} from '../../src/helpers/uniqueId';

const publicKey = '4AUBSKiiXmgy4oENcu3XdinaEkntCsZeWRoa4yFshaBc';

describe('"uniqueId" helper', () => {
  describe('"getTimelineId" function', () => {
    interface Scenario {
      description: string;
      received: GetTimelineIdOpts;
      expected: TimelineId;
    }

    const scenario: Scenario[] = [
      {
        description: 'should produce a valid timelineId',
        received: {
          version: '0.0.0',
          publicKey,
          feedId: 'feed-id',
        },
        expected: {
          hash: '5265fd6f81cbfa814f840351ccb433a429750aba',
          word: 'roast',
          id: 'roast-5265fd6f81',
        },
      },
      {
        description: 'should produce a valid timelineId',
        received: {
          version: '0.0.0',
          publicKey,
          feedId: 'feed-id-0',
        },
        expected: {
          hash: '0eb250919944944abae69e66e68e42dafdd615a6',
          word: 'cobbler',
          id: 'cobbler-0eb2509199',
        },
      },
    ];

    test.each(scenario)('$description', ({ received, expected }) => {
      const actual = getTimelineId(received);
      expect(actual).toEqual(expected);
    });
  });

  describe('"getHTMLId" function', () => {
    interface Scenario {
      description: string;
      received: GetUniqueIdOpts;
      expected: string;
    }

    const timelineId = getTimelineId({
      version: '0.0.0.0',
      publicKey,
      feedId: '0',
    });

    const secondTimelineId = getTimelineId({
      version: '0.0.0.0',
      publicKey,
      feedId: '0-1',
    });

    const scenario: Scenario[] = [
      {
        description: 'should produce a valid unique Id',
        received: {
          ...timelineId,
          nature: { type: 'search', query: 'q' },
          href: 'https://www.tiktok.com/search?query=q',
          feedCounter: 0,
          videoCounter: 0,
          incremental: 0,
        },
        expected: '013229a76c2dfe4a8e6003c901ccc77a5eb6c7ed',
      },
      {
        description: 'should produce the same uniqueId',
        received: {
          ...timelineId,
          nature: { type: 'search', query: 'q' },
          href: 'https://www.tiktok.com/search?query=q',
          feedCounter: 0,
          videoCounter: 0,
          incremental: 0,
        },
        expected: '013229a76c2dfe4a8e6003c901ccc77a5eb6c7ed',
      },
      {
        description: 'should produce a valid timelineId',
        received: {
          ...timelineId,
          nature: { type: 'search', query: 'q' },
          href: 'https://www.tiktok.com/search?query=q',
          feedCounter: 0,
          videoCounter: 0,
          incremental: 1,
        },
        expected: '44355181cd9619180205f6082163328d65434ea1',
      },
      {
        description: 'should produce a valid timelineId',
        received: {
          ...secondTimelineId,
          nature: { type: 'search', query: 'q' },
          href: 'https://www.tiktok.com/search?query=q',
          feedCounter: 1,
          videoCounter: 0,
          incremental: 0,
        },
        expected: '001b56e0cff0be598e069faca10aba39c69ed451',
      },
    ];

    test.each(scenario)('$description', ({ received, expected }) => {
      const actual = getHTMLId.hash(received);
      expect(actual).toEqual(expected);
    });
  });

  describe('"getMetadataId" function', () => {
    interface Scenario {
      description: string;
      received: { htmlId: string; clientTime: string };
      expected: string;
    }

    const timelineId = getTimelineId({
      version: '0.0.0.0',
      publicKey,
      feedId: '0',
    });

    const htmlId = getHTMLId.hash({
      href: 'https://www.tiktok.com/foryou',
      nature: { type: 'foryou' },
      ...timelineId,
      feedCounter: 0,
      videoCounter: 0,
      incremental: 0,
    });

    const firstJan2021 = new Date('01/01/2021').toDateString();
    const secondJan2021 = new Date('01/02/2021').toDateString();

    const scenario: Scenario[] = [
      {
        description: 'should produce a valid unique Id',
        received: {
          htmlId,
          clientTime: firstJan2021,
        },
        expected: '413867065ed2747dbe5f73161e2b009a6719611f',
      },
      {
        description: 'should produce the same uniqueId',
        received: {
          htmlId,
          clientTime: secondJan2021,
        },
        expected: 'fbe90b80f216a11d55bc2bc349c2aacf8c9aaa58',
      },
    ];

    test.each(scenario)('$description', ({ received, expected }) => {
      const actual = getMetadataId.hash(received);
      expect(actual).toEqual(expected);
    });
  });
});
