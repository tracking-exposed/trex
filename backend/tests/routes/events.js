const _ = require('lodash');
const expect    = require("chai").expect;
const nconf = require("nconf");
const moment = require("moment");
const debug = require("debug")("test:testRoutesEvents");
const fs = require('fs');
const path = require('path');

const events = require('../../routes/events');
const tags = require('../../routes/tags');
const supporters = require('../../lib/supporters');
const personal = require('../../routes/personal');

nconf.argv().env().file({ file: "config/settings.json" });
nconf.stores.env.readOnly = false;
nconf.set('storage', '_test_htmls');
nconf.stores.env.readOnly = true;


/* This first check the capacity of load data and verify they are avail */
describe("Testing the video submission", function() {

  const dummyKey = "ABCDEF789012345678901234567890";
  const dummyVideoId = 'MOCKUPID';
  const mockUpVideoCapture = {
      href: `https://www.youtube.com/watch?v=${dummyVideoId}`,
      clientTime: moment().toISOString(),
      element: "asdasdasd"
  };
  const diskdir = path.join(nconf.get('storage'), moment().format("YYYY-MM-DD"));

  it("delete if exists the dummy supporter", async function() {
      const result = await supporters.remove(dummyKey);
      expect(result.result.ok).to.be.equal(1);
  });

  it("creates the dummy directory", function() {
      try {
          fs.mkdirSync(diskdir);
      } catch(error) {
          expect(error.code).to.be.equal("EEXIST");
      }

      const check = fs.existsSync(diskdir);
      expect(check).to.be.true;
  });

  it("commit a video from an unknow profile", async function() {

      const inserted = await events.TOFU(dummyKey);
      expect(inserted).to.be.an('array');
      expect(_.first(inserted).publicKey).to.be.equal(dummyKey);

      const answer = await events.saveVideo(mockUpVideoCapture, inserted[0]);
      expect(answer).to.be.true;
  });

  it("remove the entry because the owner can always delete an entry", async function() {
      const evidence = await personal.evidenceGet({ params: {
          videoId: dummyVideoId,
          publicKey: dummyKey
      }});

      expect(evidence.json).to.be.an('array');

      _.map(evidence.json, async function(efound) {
          const check = await personal.evidenceRemove({
              params: {
                  publicKey: dummyKey,
                  id: efound.id
              }
          });
          expect(check.json.success).to.be.true;
      });
  });

  it("commit and remove a tagged video", async function() {
      const randomTag ="blah-random-tag";
      const taganswer = await tags.add({
          params: { publicKey: dummyKey },
          body: { tag: randomTag }
      });

      const supporter = taganswer.json;
      expect(supporter.publicKey).to.be.equal(dummyKey);
      expect(supporter.tags).to.be.an('array');
      expect(supporter.tags[0]).to.be.equal(randomTag);

      const video = await events.saveVideo(mockUpVideoCapture, supporter);
      expect(video).to.be.true;

      const evidence = await personal.evidenceGet({ params: {
          videoId: dummyVideoId,
          publicKey: dummyKey
      }});

      expect(evidence.json).to.be.an('array');
      expect(_.size(evidence.json)).to.be.equal(1);
      expect(evidence.json[0].tags).to.be.an('array');
      expect(evidence.json[0].tags[0]).to.be.equal(randomTag);

      const clean = await personal.evidenceRemove({
          params: {
              publicKey: dummyKey,
              id: evidence.json[0].id
          }
      });
      expect(clean.json.success).to.be.true;

      const cleanSupporter = await supporters.remove(dummyKey);
      expect(cleanSupporter.result.ok).to.be.equal(1);

  });

});
