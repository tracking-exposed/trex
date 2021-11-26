// mocks
jest.mock("../../lib/mongo3");
jest.mock("../../lib/curly");
jest.mock("../../lib/ycai");

import { GetTest, Test } from "../../tests/Test";
import youchoose from "../youchoose";
import * as curly from "../../lib/curly";
import * as ycai from "../../lib/ycai";

const curlyMock = curly as jest.Mocked<typeof curly>;
const ycaiMock = ycai as jest.Mocked<typeof ycai>;

const TMPRWRKR = "UCbaf8gVrbDzolaeMtP3-XhA";

/* This first check the capacity of load data and verify they are avail */
describe("Testing the token request", () => {
  /*| this below is the request expected in 
    | routes/youchoose.js creatorRegister
    | /api/v3/creator/:channelId/register */
  const registerRequest = {
    body: {
      type: "channel",
    },
    params: {
      channelId: TMPRWRKR,
    },
  };
  let verificationToken, tests: Test;

  beforeAll(() => {
    tests = GetTest();
  });
  afterAll(() => {
    jest.clearAllMocks();
  })

  /* the "register" causes one thing:
   - it is produced a verificationToken, which has to go 
     into the channel description.
   - server side a channelId can only have ONE verificationToken per time */

  it("Request a token", async () => {
    curlyMock.verifyChannel.mockResolvedValueOnce(true);
    ycaiMock.generateToken.mockResolvedValueOnce(
      "test-token-long-40-chars-for-real-if-had"
    );
    const { json } = await youchoose.creatorRegister(registerRequest);

    expect(typeof json.verificationToken).toEqual("string");
    expect(json.verificationToken?.length).toBe(40);
    expect(typeof json.tokenString).toEqual("string");
    verificationToken = json.verificationToken;

    /* this should happen */
    if (json.token) {
      const url = `https://www.youtube.com/channel/${json.channelId}/about`;
      const what = `This string ${json.tokenString} should be copied in the description of ${url}`;
      console.log(what);
    }
  });

  it("The creator should not be verified yet (test by Token)", async () => {
    /* by invoking creatorGet a creator would retrieved
     * information on their channel. The filter might be
     * composed by verificationToken or by channelId, and
     * must be in the header */
    const result = await youchoose.creatorGet({
      headers: {
        "x-authorization-token": "e6d09bc0bdbeabe21da5d617aae43d8f5af72109",
      },
    });
    // expect(result.json.verified).toBe(false);
    expect(result.json.error).toBe(true);
  });

  it("The creator should not be verified yet (test by Channel)", async function () {
    const result = await youchoose.creatorGet({
      headers: {
        channelId: TMPRWRKR,
      },
    });
    // expect(result.json.verified).toBe(false);
    expect(result.json.error).toBe(true);
  });

  it("Invoke verification", async function () {
    jest.setTimeout(10000);
    const result = await youchoose.creatorVerify({
      params: {
        channelId: registerRequest.params.channelId,
      },
    });

    // expect(result.json.username).toEqual("temporaryworkaround");
    expect(result.json.error).toBe(true);
  });

  it("Test creator/me when validated", async function () {
    ycaiMock.getCreatorByToken.mockResolvedValue({
      verified: true,
      channelId: TMPRWRKR,
      accessToken: 'ACT-test',
      registeredOn: new Date(),
    });
    const result = await youchoose.creatorGet({
      headers: {
        "x-authorization": TMPRWRKR,
      },
    });

    expect(result.json.accessToken).toBe('ACT-test');
  });
});
