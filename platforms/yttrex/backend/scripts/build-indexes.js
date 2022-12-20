/* eslint-disable */

function checkret(info, retval) {
  retval.info = info;
  printjson(retval);
}

ret = db.metadata.createIndex({ id: 1 }, { unique: true });
checkret('metadata id', ret);
ret = db.metadata.createIndex({ videoId: 1 });
checkret('metadata videoId', ret);
ret = db.metadata.createIndex({ 'nature.type': 1 });
checkret('metadata nature.type', ret);
ret = db.metadata.createIndex({ type: 1 });
checkret('metadata type', ret);
ret = db.metadata.createIndex({ 'related.videoId': 1 });
checkret('metadata related.videoId', ret);
ret = db.metadata.createIndex({ 'selected.videoId': 1 });
checkret('metadata selected.videoId', ret);
ret = db.metadata.createIndex({ authorName: 1 });
checkret('metadata authorName', ret);
ret = db.metadata.createIndex({ authorSource: 1 });
checkret('metadata authorSource', ret);
ret = db.metadata.createIndex({ savingTime: -1 });
checkret('metadata savingTime', ret);
ret = db.metadata.createIndex({ href: -1 });
checkret('metadata href', ret);
ret = db.metadata.createIndex({ experimentId: 1 });
checkret('metadata experimentId', ret);

ret = db.supporters.createIndex({ publicKey: 1 }, { unique: true });
checkret('supporters publicKey:', ret);
ret = db.supporters.createIndex({ lastActivity: 1 });
checkret('supporters lastActivity:', ret);

/* metadataId is not used to address content, if not when --id option is specify in parserv */
ret = db.htmls.createIndex({ id: 1 }, { unique: true });
checkret('htmls id', ret);
ret = db.htmls.createIndex({ savingTime: -1 });
checkret('htmls savingTime', ret);
ret = db.htmls.createIndex({ processed: 1 });
checkret('htmls processed', ret);
ret = db.htmls.createIndex({ metadataId: 1 });
checkret('htmls metadataId', ret);
ret = db.htmls.createIndex({ href: 1 }); /* DONE IN PROD */
ret = db.htmls.createIndex({ 'type.nature': 1 }); /* TODO */
checkret('htmls type', ret);

ret = db.leaves.createIndex({ metadataId: 1 });
checkret('leavers metadataId', ret);
ret = db.leaves.createIndex(
  { savingTime: -1 },
  { expireAfterSeconds: 7 * 24 * 3600 }
);
checkret('leaves savingTime expiring', ret);
ret = db.leaves.createIndex({ selectorName: 1 });
checkret('leaves selectorName', ret);

ret = db.errors.createIndex({ id: 1 }, { unique: true });
checkret('errors id', ret);
ret = db.errors.createIndex({ when: -1 });
checkret('errors when', ret);

ret = db.ads.createIndex({ metadataId: 1 });
checkret('ads metadataId', ret);
ret = db.ads.createIndex({ savingTime: -1 });
checkret('ads savingTime', ret);
ret = db.ads.createIndex({ id: 1 }, { unique: true });
checkret('ads id', ret);

ret = db.experiments.createIndex({ experimentId: -1 }, { unique: true });
checkret('experiments experimentId', ret);
ret = db.experiments.createIndex({ when: -1 });
checkret('experiments when', ret);

/* below this the collections are for youchoose */
ret = db.recommendations.createIndex({ urlId: 1 }, { unique: true });
checkret('recommendations urlId', ret);
ret = db.recommendations.createIndex({ when: -1 });
checkret('recommendations when', ret);

ret = db.ytvids.createIndex({ videoId: -1 }, { unique: true });
checkret('ytvids videoId', ret);
ret = db.ytvids.createIndex({ creatorId: -1 });
checkret('ytvids creatorId', ret);

ret = db.tokens.createIndex({ channelId: 1 }, { unique: true });
checkret('tokens unique channelId', ret);
ret = db.tokens.createIndex({ verificationToken: 1 });
checkret('tokens verificationToken', ret);
ret = db.tokens.createIndex(
  { expireAt: -1 },
  { expireAfterSeconds: 7 * 24 * 3600 }
);
checkret('tokens expireAt expiring', ret);

ret = db.creators.createIndex({ channelId: 1 }, { unique: true });
checkret('creators channelId', ret);
ret = db.creators.createIndex({ accessToken: 1 });
checkret('creators accessToken', ret);
