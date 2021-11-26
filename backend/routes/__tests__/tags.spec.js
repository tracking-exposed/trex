const _ = require('lodash');
const debug = require("debug")("test:testRoutesTags");

// const tags = require('routes/tags');
const { TOFU } = require('../events');
const supporters = require('../../lib/supporters');

/* This first check the capacity of load data and verify they are avail */
describe.skip("Testing the tags related routes", function() {
  const dummyKey = "123456789012345678901234567890";

  it("delete if exists", async function() {
      const result = await supporters.remove(dummyKey);
      expect(result.result.ok).toBe(1);
  });

  it("preparation - this create a new dummy profile", async function() {
      const profile = await TOFU(dummyKey);
      expect(profile).to.be.an('array');
      expect(_.first(profile)).to.include({ "publicKey": dummyKey});
      const pseudon = "wheatberry-currant-milk";
      expect(profile[0].p).toBe(pseudon);
  });

  it("retrieve 0 tags", async function() {
      const answer = await tags.get({params: { publicKey: dummyKey}})
      const profile = answer.json;
      expect(profile.tags).toBeUndefined();
  });

  it("add two tags", async function() {

      const first = 'first';
      const check1 = await tags.add({
        params: { publicKey: dummyKey },
        body: { tag: first }
      });
      expect(check1.json.tags).toBeInstanceOf(Array);
      expect(_.first(check1.json.tags)).toBe(first);

      const second = 'second';
      const check2 = await tags.add({
        params: { publicKey: dummyKey },
        body: { tag: second }
      });
      expect(check2.json.tags).toBeInstanceOf(Array);
      expect(_.first(check2.json.tags)).toBe(first);
      expect(_.last(check2.json.tags)).toBe(second);
  });

  it("remove a tag", async function() {

      const removesecond = 'second';
      const check = await tags.remove({
        params: { publicKey: dummyKey },
        body: { tag: removesecond }
      });

      expect(check.json.tags).to.be.an('array');
      expect(_.size(check.json.tags)).toBe(1);
  });

  it("refuses duplicate tags", async function() {

      const first = 'first';
      const check = await tags.add({
        params: { publicKey: dummyKey },
        body: { tag: first }
      });

      expect(check.json.tags).to.be.an('array');
      expect(_.size(check.json.tags)).toBe(1);
  });

});
