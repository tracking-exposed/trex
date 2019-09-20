const _ = require('lodash');
const expect    = require("chai").expect;
const nconf = require("nconf");
const moment = require("moment");
const debug = require("debug")("test:testRoutesTags");

const tags = require('../../routes/tags');
const { TOFU } = require('../../routes/events');
const supporters = require('../../lib/supporters');

nconf.argv().env().file({ file: "config/settings.json" });

/* This first check the capacity of load data and verify they are avail */
describe("Testing the tags related routes", function() {
  const token = "123456789012345678901234567890";

  it("delete if exists", async function() {
      const result = await supporters.remove(token);
      debug("-- %j", result);
      expect(result.result.ok).to.be(1);
      done();
  });

  it("preparation - this create a new dummy profile", async function() {
      const profile = await TOFU(token);
      expect(profile).to.be.an('array');
      expect(_.first(profile)).to.include({ "publickey": token});
      const pseudon = "wheatberry-currant-milk";
      expect(profile[0].p).to.be(pseudon);
      done();
  });

  it("retrieve 0 tags", async function() {
      const answer = await tags.get({params: { publicKey: token}})
      debug("retrieved %j", answer);
      const profile = answer.json;
      expect(profile.tags).to.be.undefined;
      done();
  });

  it("add a tag", async function() {
      const first = 'first';
      const answer1 = await tags.add({
        params: { publicKey: token },
        body: { tag: first }
      });
      debug("+ %j", answer1);

      const second = 'second';
      const answer2 = await tags.add({
        params: { publicKey: token },
        body: { tag: second }
      });
      debug("+ %j", answer2);
      done();
  });

});
