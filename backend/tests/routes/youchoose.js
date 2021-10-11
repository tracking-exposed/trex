const _ = require('lodash');
const expect    = require("chai").expect;
const nconf = require("nconf");
const moment = require("moment");

const youchoose = require('../../routes/youchoose');

nconf.argv().env().file({ file: "config/settings.json" });

/* This first check the capacity of load data and verify they are avail */
describe("Testing the token request", function() {

  const req = { body: {
    type: "channel",
    channelId: "UC4MLdXKCYBjLyJo6XOs1C5Q"
  }};

  it("Request a token", async function() {
    const result = await youchoose.creatorRegister(req);
    expect(result.json.token).to.be.a("string");
  });

  if("Triggers the validation", async function() {
    const result = await youchoose.creatorVerify
  });
});
