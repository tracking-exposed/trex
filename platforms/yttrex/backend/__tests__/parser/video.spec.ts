import moment from 'moment';
import { makeAbsolutePublicationTime } from '@yttrex/shared/parser/parsers/video';

describe('Parser: Video', () => {
  // let appTest: Test;
  // const newKeypair = nacl.sign.keyPair();
  // const publicKey = base58.encode(newKeypair.publicKey);

  beforeAll(async () => {
    // appTest = await GetTest();
  });

  jest.setTimeout(20 * 1000);

  describe('makeAbsolutePublicationTime', () => {
    test('succeeds with timePrecision equal to "error" when "recommendedPubTime" is not provided', () => {
      const clientTime = new Date();
      const videos = [
        {
          index: 0,
          elems: 0,
          videoId: 'first-video-id',
          label: 'first-video',
          thumbnailHref: '',
          recommendedSource: '/c/first-channel',
          recommendedPubTime: undefined,
          recommendedRelativeSeconds: 10,
        },
      ];

      const receivedVideos = makeAbsolutePublicationTime(videos, clientTime);

      expect(receivedVideos).toMatchObject(
        videos.map(({ recommendedPubTime, ...v }) => ({
          ...v,
          publicationTime: undefined,
          timePrecision: 'error',
        }))
      );
    });

    test('succeeds with timePrecision equal to "estimated"', () => {
      const clientTime = new Date();
      const videos = [
        {
          index: 0,
          elems: 0,
          videoId: 'first-video-id',
          label: 'first-video',
          thumbnailHref: '',
          recommendedSource: '/c/first-channel',
          recommendedPubTime: moment.duration({ seconds: 10 }),
        },
      ];

      const receivedVideos = makeAbsolutePublicationTime(videos, clientTime);

      expect(
        receivedVideos.map(({ publicationTime, ...r }) => ({
          ...r,
          publicationTime: publicationTime?.toISOString(),
        }))
      ).toMatchObject(
        videos.map(({ recommendedPubTime, ...v }) => ({
          ...v,
          publicationTime: moment(clientTime)
            .subtract(recommendedPubTime)
            .toISOString(),
          timePrecision: 'estimated',
        }))
      );
    });
  });
});
