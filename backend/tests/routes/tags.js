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
      expect(result.result.ok).to.be.equal(1);
  });

  it("preparation - this create a new dummy profile", async function() {
      const profile = await TOFU(token);
      expect(profile).to.be.an('array');
      expect(_.first(profile)).to.include({ "publicKey": token});
      const pseudon = "wheatberry-currant-milk";
      expect(profile[0].p).to.be.equal(pseudon);
  });

  it("retrieve 0 tags", async function() {
      const answer = await tags.get({params: { publicKey: token}})
      const profile = answer.json;
      expect(profile.tags).to.be.undefined;
  });

  it("add two tags", async function() {

      const first = 'first';
      const check1 = await tags.add({
        params: { publicKey: token },
        body: { tag: first }
      });
      expect(check1.json.tags).to.be.an('array');
      expect(_.first(check1.json.tags)).to.be.equal(first);

      const second = 'second';
      const check2 = await tags.add({
        params: { publicKey: token },
        body: { tag: second }
      });
      expect(check2.json.tags).to.be.an('array');
      expect(_.first(check2.json.tags)).to.be.equal(first);
      expect(_.last(check2.json.tags)).to.be.equal(second);
  });

  it("remove a tag", async function() {

      const removesecond = 'second';
      const check = await tags.remove({
        params: { publicKey: token },
        body: { tag: removesecond }
      });

      expect(check.json.tags).to.be.an('array');
      expect(_.size(check.json.tags)).to.be.equal(1);
  });

  it("refuses duplicate tags", async function() {

      const first = 'first';
      const check = await tags.add({
        params: { publicKey: token },
        body: { tag: first }
      });

      expect(check.json.tags).to.be.an('array');
      expect(_.size(check.json.tags)).to.be.equal(1);
  });

});
