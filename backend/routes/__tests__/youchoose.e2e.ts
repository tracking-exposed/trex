// mock curly module
jest.mock("../../lib/curly");

// import test utils
import { Test, GetTest } from "../../tests/Test";

// import mocked curly from source
import * as curly from "../../lib/curly";
const curlyMock = curly as jest.Mocked<typeof curly>;

describe("Youchoose routes", () => {
  const channelId = "fake-channel-id";
  let test: Test;

  beforeAll(async () => {
    test = await GetTest();
  });

  it("Content creator registration by channelId", async () => {
    curlyMock.verifyChannel.mockResolvedValueOnce(true);

    const { body } = await test.app
      .post(`/api/v3/creator/${channelId}/register`)
      .send({ type: "channel" })
      .expect(200);

    expect(body.verified).toBe(false);
    expect(new Date(body.expireAt)).toBeInstanceOf(Date)
  });
});
