/* eslint-disable import/first */
// mock curly module
jest.mock("../../lib/curly");
jest.mock("fetch-opengraph");

import { VideoArb } from "@shared/arbitraries/Video.arb";
import { AdArb } from "../../tests/arbitraries/Ad.arb";
import { MetadataArb } from "../../tests/arbitraries/Metadata.arb";
import { fc } from "@shared/test";
import { v4 as uuid } from "uuid";
import { GetTest, Test } from "../../tests/Test";
import { sub } from "date-fns";

describe("The ADS API", () => {
  const channelId = uuid();
  let test: Test;

  beforeAll(async () => {
    test = await GetTest();
  });

  afterAll(async () => {
    await test.mongo.close();
  });

  describe("Get by channel", () => {
    it("fails using channelId without date range", async () => {
      const { body } = await test.app
        .get(`/api/v2/ad/channel/${channelId}`)
        .query({})
        .expect(500);

      expect(body).toEqual({
        error: true,
        message:
          "Error in date format, expected YYYY-MM-DD: Invalid 'since' query param undefined",
      });
    });

    it("fails using channelId without 'since' param", async () => {
      const { body } = await test.app
        .get(`/api/v2/ad/channel/${channelId}`)
        .query({
          till: "2022-01-01",
        })
        .expect(500);

      expect(body).toEqual({
        error: true,
        message:
          "Error in date format, expected YYYY-MM-DD: Invalid 'since' query param undefined",
      });
    });

    it("fails using channelId without 'till' param", async () => {
      const { body } = await test.app
        .get(`/api/v2/ad/channel/${channelId}`)
        .query({
          since: "2022-01-01",
        })
        .expect(500);

      expect(body).toEqual({
        error: true,
        message:
          "Error in date format, expected YYYY-MM-DD: Invalid 'till' query param undefined",
      });
    });

    it("succeeds using channelId", async () => {
      const { body } = await test.app
        .get(`/api/v2/ad/channel/${channelId}`)
        .query({
          since: "2020-01-01",
          till: "2021-01-01",
        })
        .expect(200);

      expect(body).toEqual([]);
    });
  });

  describe("Get by video", () => {
    const video = fc.sample(VideoArb, 1)[0];

    it("fails using wrong videoId", async () => {
      const { body } = await test.app
        .get(`/api/v2/ad/video/fake-id`)
        .query({
          since: "2020-01-01",
          till: "2021-01-01",
        })
        .expect(502);

      expect(body).toEqual({});
    });

    it("fails using videoId", async () => {
      const { body } = await test.app
        .get(`/api/v2/ad/video/${video.videoId}`)
        .query({
          since: "2020-01-01",
          till: "2021-01-01",
        })
        .expect(200);

      expect(body).toEqual([]);
    });

    it("succeeds using videoId", async () => {
      const videoId = fc.sample(fc.uuid(), 1)[0];
      const [metadata] = fc.sample(MetadataArb, 1).map((meta) => ({
        ...meta,
        videoId,
        savingTime: sub(new Date(), { weeks: 3 }),
      }));
      const ads = fc.sample(AdArb, 5).map((ad, i) => ({
        ...ad,
        sponsoredSite:
          i % 2 === 0
            ? ad.sponsoredSite
            : i % 3 === 0
            ? undefined
            : ad.sponsoredSite.concat(`/`),
        metadataId: metadata.id,
        nature: {
          type: "video",
          videoId,
        },
        savingTime: sub(new Date(), { weeks: 3 }),
      }));

      // insert video
      await test.mongo3.insertMany(
        test.mongo,
        test.config.get("schema").metadata,
        [metadata]
      );
      // insert ads
      await test.mongo3.insertMany(
        test.mongo,
        test.config.get("schema").ads,
        ads
      );

      const { body } = await test.app
        .get(`/api/v2/ad/video/${videoId}`)
        .expect(200);

      expect(body).toHaveLength(5);
    });
  });
});
