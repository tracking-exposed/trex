ret = db.metadata.createIndex({ id: 1 }, { unique: true }); checkret('metadata id', ret);
ret = db.metadata.createIndex({ videoId: 1 }); checkret('metadata videoId', ret);
ret = db.metadata.createIndex({ type: 1 }); checkret('metadata type', ret);
ret = db.metadata.createIndex({ "related.videoId": 1 }); checkret('metadata related.videoId', ret);
ret = db.metadata.createIndex({ "selected.videoId": 1 }); checkret('metadata selected.videoId', ret);
ret = db.metadata.createIndex({ authorName: 1 }); checkret('metadata authorName', ret);
ret = db.metadata.createIndex({ savingTime: -1 }); checkret('metadata savingTime', ret);

ret = db.supporters.createIndex({ publicKey: 1 }, { unique: true }); checkret('supporters publicKey:', ret);
ret = db.supporters.createIndex({ lastActivity: 1 }); checkret('supporters lastActivity:', ret);

ret = db.groups.createIndex({ id: 1 }, { unique: true }); checkret('groups id', ret);
ret = db.groups.createIndex({ name: 1 }, { unique: true }); checkret('groups name', ret);

/* metadataId is not used to address content, if not when --id option is specify in parserv */
ret = db.htmls.createIndex({ id: 1 }, { unique: true }); checkret('htmls id', ret);
ret = db.htmls.createIndex({ savingTime: -1 }); checkret('htmls savingTime', ret);
ret = db.htmls.createIndex({ processed: 1 }); checkret('htmls processed', ret);
ret = db.htmls.createIndex({ metadataId: 1 }); checkret('htmls metadataId', ret);
ret = db.htmls.createIndex({ type: 1 }); checkret('htmls type', ret);

ret = db.labels.createIndex({ metadataId: 1 }); checkret('labels processed', ret);
ret = db.labels.createIndex({ savingTime: -1}, { expireAfterSeconds: 7 * 24 * 3600 }); checkret('labels savingTime expiring', ret);
ret = db.labels.createIndex({ selectorName: 1}); checkret('labels expiring', ret);

ret = db.searches.createIndex({ metadataId: 1 }); checkret('searches metadataId', ret);
ret = db.searches.createIndex({ savingTime: -1 }); checkret('searches savingTime', ret);
ret = db.searches.createIndex({ id: 1 }, { unique: true }); checkret('searches id', ret);

ret = db.queries.createIndex({ id: 1 }, { unique: true }); checkret('queries id', ret);
ret = db.queries.createIndex({ publicKey: 1 }); checkret('queries publicKey', ret);
ret = db.queries.createIndex({ savingTime: -1 }); checkret('queries savingTime', ret);
ret = db.queries.createIndex({ searchTerms: -1 }); checkret('queries searchTerms', ret);

ret = db.errors.createIndex({ id: 1 }, { unique: true }); checkret('errors id', ret);
ret = db.errors.createIndex({ when: -1 }); checkret('errors when', ret);

ret = db.campaigns.createIndex({ name: 1 }, { unique: true }); checkret('campaigns name', ret);

ret = db.recommendations.createIndex({ urlId: 1 }, { unique: true }); checkret('recommendations urlId', ret);
ret = db.recommendations.createIndex({ when: -1 }); checkret('recommendations when', ret);

ret = db.ytvids.createIndex({ videoId: -1}, { unique: true}); checkret('ytvids videoId', ret);
ret = db.ytvids.createIndex({ creatorId: -1}); checkret('ytvids creatorId', ret);

ret = db.directives.createIndex({ experimentId: -1}, {unique: true}); checkret('directives experimentId', ret);

ret = db.experiments.createIndex({ experimentId: -1}); checkret('experiments experimentId', ret);
ret = db.experiments.createIndex({ publicKey: -1}); checkret('experiments publicKey', ret);
ret = db.experiments.createIndex({ testTime: -1}, { expireAfterSeconds: 18 * 3600 }); checkret('experiments savingTime 18 hours TTL', ret);

ret = db.ads.createIndex({ metadataId: 1 }); checkret('ads metadataId', ret);
ret = db.ads.createIndex({ savingTime: -1 }); checkret('ads savingTime', ret);
ret = db.ads.createIndex({ id: 1 }, { unique: true }); checkret('ads id', ret);

function checkret(info, retval) {
    retval.info = info;
    printjson(retval);
};
