import fs from 'fs';
import path from 'path';
import supporters from '../../lib/supporters';
import { GetTest, Test } from '../../tests/Test';
import format from 'date-fns/format';

/* This first check the capacity of load data and verify they are avail */
describe.skip('Testing the video submission', function () {
  const dummyKey = 'ABCDEF789012345678901234567890';
  const dummyVideoId = 'MOCKUPID';
  const mockUpVideoCapture = {
    href: `https://www.youtube.com/watch?v=${dummyVideoId}`,
    clientTime: new Date().toISOString(),
    element: 'asdasdasd',
  };

  let test: Test, storageDir;

  beforeAll(async () => {
    test = await GetTest();
    storageDir = path.join(
      test.config.get('storage'),
      format(new Date(), 'YYYY-MM-DD')
    );
  });

  it('delete if exists the dummy supporter', async function () {
    const result = await supporters.remove(dummyKey);
    expect(result.result.ok).toBe(1);
  });

  it('creates the dummy directory', function () {
    try {
      fs.mkdirSync(storageDir);
    } catch (error) {
      expect(error.code).toBe('EEXIST');
    }

    const check = fs.existsSync(storageDir);
    expect(check).toBe(true);
  });

  //   it("commit a video from an unknow profile", async function() {

  //       const inserted = await events.TOFU(dummyKey);
  //       expect(inserted).toBeInstanceOf(Array);
  //       expect(_.first(inserted).publicKey).toBe(dummyKey);

  //       const answer = await events.processEvents2(mockUpVideoCapture, inserted[0]);
  //       expect(answer).toBe(true);
  //   });

  //   it("remove the entry because the owner can always delete an entry", async function() {
  //       const evidence = await personal.evidenceGet({ params: {
  //           videoId: dummyVideoId,
  //           publicKey: dummyKey
  //       }});

  //       expect(evidence.json).toBeInstanceOf(Array);

  //       _.map(evidence.json, async function(efound) {
  //           const check = await personal.evidenceRemove({
  //               params: {
  //                   publicKey: dummyKey,
  //                   id: efound.id
  //               }
  //           });
  //           expect(check.json.success).toBe(true);
  //       });
  //   });

  //   it("commit and remove a tagged video", async function() {
  //       const randomTag ="blah-random-tag";
  //       const taganswer = await tags.add({
  //           params: { publicKey: dummyKey },
  //           body: { tag: randomTag }
  //       });

  //       const supporter = taganswer.json;
  //       expect(supporter.publicKey).toBe(dummyKey);
  //       expect(supporter.tags).toBeInstanceOf(Array);
  //       expect(supporter.tags[0]).toBe(randomTag);

  //       const video = await events.saveVideo(mockUpVideoCapture, supporter);
  //       expect(video).to.be.true;

  //       const evidence = await personal.evidenceGet({ params: {
  //           videoId: dummyVideoId,
  //           publicKey: dummyKey
  //       }});

  //       expect(evidence.json).toBeInstanceOf(Array);
  //       expect(_.size(evidence.json)).toBe(1);
  //       expect(evidence.json[0].tags).toBeInstanceOf(Array);
  //       expect(evidence.json[0].tags[0]).toBe(randomTag);

  //       const clean = await personal.evidenceRemove({
  //           params: {
  //               publicKey: dummyKey,
  //               id: evidence.json[0].id
  //           }
  //       });
  //       expect(clean.json.success).to.be.true;

  //       const cleanSupporter = await supporters.remove(dummyKey);
  //       expect(cleanSupporter.result.ok).toBe(1);

  //   });
});
