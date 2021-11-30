/* eslint-disable import/first */
// mock curly module
jest.mock("../../lib/curly");
jest.mock("fetch-opengraph");

// import test utils
import { Test, GetTest } from "../../tests/Test";
import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
// import mocked curly from source
import * as curly from "../../lib/curly";
import { ContentCreator } from "@shared/models/ContentCreator";
import { fc } from "@shared/test";
import { ContentCreatorArb } from "@shared/arbitraries/ContentCreator.arb";
import { VideoArb } from "@shared/arbitraries/Video.arb";
import { Video } from "@shared/models/Video";
import { v4 as uuid } from "uuid";
import fetchOpenGraph from "fetch-opengraph";
import { Recommendation } from "@shared/models/Recommendation";

const curlyMock = curly as jest.Mocked<typeof curly>;
const fetchOpenGraphMock = fetchOpenGraph as jest.Mocked<typeof fetchOpenGraph>;

describe("The YouChoose API", () => {
  const channelId = uuid();
  let test: Test,
    verificationToken: string,
    contentCreator: ContentCreator,
    videos: Video[],
    recommendations: Recommendation[];

  beforeAll(async () => {
    test = await GetTest();
  });

  describe("Register a Content Creator", () => {
    it("fails using channelId", async () => {
      const registrationError = {
        error: true,
        message: "Channel id not found",
      };
      curlyMock.verifyChannel.mockResolvedValueOnce(registrationError);

      const { body } = await test.app
        .post(`/api/v3/creator/${channelId}/register`)
        .send({ type: "channel" })
        .expect(500);

      expect(body).toEqual(registrationError);
    });

    it("succeeds using channelId", async () => {
      curlyMock.verifyChannel.mockResolvedValueOnce(true);

      const { body } = await test.app
        .post(`/api/v3/creator/${channelId}/register`)
        .send({ type: "channel" })
        .expect(200);

      expect(body.verified).toBe(false);
      expect(new Date(body.expireAt)).toBeInstanceOf(Date);
      verificationToken = body.verificationToken;
    });
  });

  describe("Verify Content Creator", () => {
    it("fails to verify Content Creator for wrong code", async () => {
      const pageData = {
        ...fc.sample(ContentCreatorArb, 1)[0],
        channelId,
        code: "fake-code",
      };
      curlyMock.tokenFetch.mockResolvedValueOnce(pageData);
      const { body } = await test.app.post(
        `/api/v3/creator/${channelId}/verify`
      );

      expect(body).toEqual({ error: true, message: "code not found!" });
    });

    it("fails to verify Content Creator for channelId not found", async () => {
      const { body } = await test.app
        .post(`/api/v3/creator/${uuid()}/verify`)
        .expect(500);

      expect(body).toEqual({ error: true, message: "token not found" });
    });

    it("verify Content creator", async () => {
      const { registeredOn, accessToken, ...cc } = fc.sample(
        ContentCreatorArb,
        1
      )[0];
      const contentCreatorData = {
        ...cc,
        username: `username-${channelId}`,
        avatar: `avatar-${channelId}`,
        channelId,
        code: verificationToken,
      };

      curlyMock.tokenFetch.mockResolvedValueOnce(contentCreatorData);
      const { body } = await test.app
        .post(`/api/v3/creator/${channelId}/verify`)
        .send()
        .expect(200);

      expect({ avatar: undefined, username: undefined, ...body }).toMatchObject(
        contentCreatorData
      );
      expect(new Date(body.registeredOn)).toBeInstanceOf(Date);
      expect(typeof body.accessToken).toEqual("string");
      contentCreator = body;
    });
  });

  describe("Get Content Creator", () => {
    it("fails get by access token", async () => {
      await test.app
        .get(`/api/v3/creator/me`)
        .send({ type: "channel" })
        .set("X-Authorization", "wrong-token")
        .expect(500);
    });

    it("succeeds with access token", async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/me`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(200);

      expect(contentCreator).toMatchObject(body);
    });
  });

  describe("Pull Content Creator videos", () => {
    it("fails for missing header", async () => {
      const { body } = await test.app
        .post(`/api/v3/creator/videos/repull`)
        .expect(500);

      expect(body).toMatchObject({ error: true });
    });

    it("succeeds with access token", async () => {
      const newVideoData = fc.sample(VideoArb, 1).map((v) => ({
        ...v,
        description: "description-is-required",
        recommendations: [],
      }));
      curlyMock.recentVideoFetch.mockResolvedValueOnce(newVideoData);

      const { body } = await test.app
        .post(`/api/v3/creator/videos/repull`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(200);

      expect(body).toMatchObject(newVideoData);

      videos = body;
    });
  });

  describe("Get Content Creator videos", () => {
    it("fails for missing header", async () => {
      const { body } = await test.app.get(`/api/v3/creator/videos`).expect(500);

      expect(body).toMatchObject({ error: true });
    });

    it("succeeds with access token", async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/videos`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(200);

      expect(body.length).toBe(1);
    });

    it("succeeds by access token", async () => {
      const newVideoData = fc.sample(VideoArb, 1).map((v) => ({
        ...v,
        description: "always-present",
        recommendations: [],
      }));
      curlyMock.recentVideoFetch.mockResolvedValueOnce(newVideoData);

      const { body } = await test.app
        .post(`/api/v3/creator/videos/repull`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(200);

      expect(newVideoData).toMatchObject(body);

      const getVideosResponse = await test.app
        .get(`/api/v3/creator/videos`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(200);

      expect(videos.concat(body)).toMatchObject(getVideosResponse.body);

      videos = getVideosResponse.body;
    });
  });

  describe("Get Content Creator video", () => {
    it("fails for missing token", async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/videos/${videos[0].videoId}`)
        .expect(500);

      expect(body).toMatchObject({ error: true });
    });

    it("fails for missing id", async () => {
      await test.app
        .get(`/api/v3/creator/videos/not-existing-video-id`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(500);
    });

    it("succeeds by videoId", async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/videos/${videos[0].videoId}`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(200);

      expect(body).toMatchObject(videos[0]);
    });
  });

  describe("Update Content Creator video recommendations", () => {
    it("fails for missing authentication", async () => {
      const { body } = await test.app
        .post(`/api/v3/creator/ogp`)
        .send({ videoId: videos[0].videoId, url: `http://fake-url/${uuid()}` })
        .expect(500);

      expect(body).toMatchObject({ error: true });
    });

    it("succeeds when the url is already present in db", async () => {
      const urlId = uuid();
      const urlOpenGraph = {
        url: `http://fake.url/${urlId}`,
        image: `http://fake.image/url/${urlId}`,
        title: `Fake title ${urlId}`,
        description: `Fake description ${urlId}`,
      };
      fetchOpenGraphMock.fetch.mockResolvedValueOnce(urlOpenGraph);
      const recommendationURL = {
        url: urlOpenGraph.url,
      };
      await test.app
        .post(`/api/v3/creator/ogp`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .send(recommendationURL)
        .expect(200);

      const { body } = await test.app
        .post(`/api/v3/creator/ogp`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .send(recommendationURL)
        .expect(200);

      expect(body).toMatchObject(recommendationURL);
    });

    it("succeeds with well formed url", async () => {
      const urlId = uuid();
      const urlOpenGraph = {
        url: `http://fake.url/${urlId}`,
        image: `http://fake.image/url/${urlId}`,
        title: `Fake title ${urlId}`,
        description: `Fake description ${urlId}`,
      };
      fetchOpenGraphMock.fetch.mockResolvedValueOnce(urlOpenGraph);
      const recommendationURL = {
        url: urlOpenGraph.url,
      };
      const { body } = await test.app
        .post(`/api/v3/creator/ogp`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .send(recommendationURL)
        .expect(200);

      expect(body).toMatchObject(urlOpenGraph);

      recommendations = [body];
    });
  });

  describe("Get content Creator recommendations", () => {
    it("fails for missing header", async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/recommendations`)
        .expect(500);

      expect(body).toMatchObject({ error: true });
    });

    it("succeeds with authentication", async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/recommendations`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .expect(200);

      expect(E.isRight(t.array(Recommendation).decode(body))).toBe(true);
    });
  });

  describe("Add recommendation to Content Creator videos", () => {
    it("fails for missing header", async () => {
      const recommendationURLIds = recommendations.map((r) => r.urlId);
      const { body } = await test.app
        .post(`/api/v3/creator/updateVideo`)
        .send({
          videoId: videos[0].videoId,
          recommendations: recommendationURLIds,
        })
        .expect(500);

      expect(body).toMatchObject({ error: true });
    });

    it("fails for missing videoId", async () => {
      const { body } = await test.app
        .post(`/api/v3/creator/updateVideo`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .send({
          recommendations: [],
        })
        .expect(500);

      expect(body).toMatchObject({
        error: true,
      });
    });

    it("fails for missing recommendations", async () => {
      const { body } = await test.app
        .post(`/api/v3/creator/updateVideo`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .send({
          videoId: videos[0].videoId,
        })
        .expect(500);

      expect(body).toMatchObject({
        error: true,
      });
    });

    it("fails for wrong recommendations ids", async () => {
      const { body } = await test.app
        .post(`/api/v3/creator/updateVideo`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .send({
          recommendations: ["fake-id"],
        })
        .expect(500);

      expect(body).toMatchObject({
        error: true,
      });
    });

    it("succeeds with new recommendations", async () => {
      const recommendationURLIds = recommendations.map((r) => r.urlId);
      const { body } = await test.app
        .post(`/api/v3/creator/updateVideo`)
        .set("X-Authorization", contentCreator.accessToken as any)
        .send({
          videoId: videos[0].videoId,
          recommendations: recommendationURLIds,
        })
        .expect(200);

      expect(body).toMatchObject({
        ...videos[0],
        recommendations: recommendationURLIds,
      });
    });
  });
});
