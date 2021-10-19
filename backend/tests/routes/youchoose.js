const _ = require('lodash');
const expect    = require("chai").expect;
const nconf = require("nconf");
const moment = require("moment");

const youchoose = require('../../routes/youchoose');

nconf.argv().env().file({ file: "config/settings.json" });

/* This first check the capacity of load data and verify they are avail */
describe("Testing the token request", function() {

  /*| this below is the request expected in 
    | routes/youchoose.js creatorRegister
    | /api/v3/creator/:channelId/register */
  const registerRequest = {
    body: {
      type: "channel",
    },
    params: {
      channelId: "UC4MLdXKCYBjLyJo6XOs1C5Q",
    }
  };

  /* the "register" causes one thing:
   - it is produced a verificationToken, which has to go 
     into the channel description.
   - server side a channelId can only have ONE verificationToken per time */

  it("Request a token", async function() {
    const result = await youchoose.creatorRegister(registerRequest);

    expect(result.json.token).to.be.a("string");
    verificationToken = _.get(result.json, 'token');

    /* this should happen */
    if(result.json.token) {
      const url = `https://www.youtube.com/channel/${result.json.channelId}`;
      const what = `This string ${result.json.tokenString} should be copied in the description of ${url}`;
      console.log(what);
    }
  }).timeout(10000);

  it("The creator should not be verified yet", async function() {
    /* by invoking creatorGet a creator would retrieved 
     * information on their channel. The filter might be 
     * composed by verificationToken or by channelId, and 
     * must be in the header */
    const result = await youchoose.creatorGet({
      headers: {
        verificationToken: "10f5c164af9e0babce366102a865464074af9c93"
      }
    });
    expect(result.json.verified).to.be.false;
  }).timeout(10000);

  it("Invoke verification", async function() {
    const result = await youchoose.creatorVerify({
      params: {
        channelId: registerRequest.params.channelId
      }
    });
    console.log("verification", result);
  }).timeout(10000);
});
