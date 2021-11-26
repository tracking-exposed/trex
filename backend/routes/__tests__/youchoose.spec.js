import youchoose from "../youchoose";
const nconf = require('nconf');

const TMPRWRKR = "UCbaf8gVrbDzolaeMtP3-XhA";

/* This first check the capacity of load data and verify they are avail */
describe("Testing the token request", function () {
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
  let verificationToken;

  /* the "register" causes one thing:
   - it is produced a verificationToken, which has to go 
     into the channel description.
   - server side a channelId can only have ONE verificationToken per time */

  it("Request a token", async function () {
    jest.setTimeout(10000);
    console.log(nconf.get());
    const result = await youchoose.creatorRegister(registerRequest);

    expect(typeof result.json.verificationToken).toEqual("string");
    expect(result.json.verificationToken.length).toBe(40);
    expect(typeof result.json.tokenString).toEqual("string");
    verificationToken = result.json.verificationToken;

    /* this should happen */
    if (result.json.token) {
      const url = `https://www.youtube.com/channel/${result.json.channelId}/about`;
      const what = `This string ${result.json.tokenString} should be copied in the description of ${url}`;
      console.log(what);
    }
  });

  it("The creator should not be verified yet (test by Token)", async function () {
    jest.setTimeout(10000);
    /* by invoking creatorGet a creator would retrieved
     * information on their channel. The filter might be
     * composed by verificationToken or by channelId, and
     * must be in the header */
    const result = await youchoose.creatorGet({
      headers: {
        'x-authorization-token': "e6d09bc0bdbeabe21da5d617aae43d8f5af72109",
      },
    });
    // expect(result.json.verified).toBe(false);
    expect(result.json.error).toBe(true);
  });

  it("The creator should not be verified yet (test by Channel)", async function () {
    jest.setTimeout(10000);
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
    jest.setTimeout(4000);
    const result = await youchoose.creatorGet({
      headers: {
        "x-authorization": TMPRWRKR,
      },
    });

    expect(result.json.error).toBe(true);
    // expect(result.json.verified).toBe(true);
  });
});
