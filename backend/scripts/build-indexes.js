ret = db.metadata.createIndex({id: 1}, {unique: true }); checkret('metadata id', ret);
ret = db.metadata.createIndex({videoId: 1}); checkret('metadata videoId', ret);
ret = db.metadata.createIndex({type: 1}); checkret('metadata type', ret);
ret = db.metadata.createIndex({"related.videoId": 1}); checkret('metadata related.videoId', ret);
ret = db.metadata.createIndex({"selected.videoId": 1}); checkret('metadata selected.videoId', ret);
ret = db.metadata.createIndex({authorName: 1}); checkret('metadata authorName', ret);
ret = db.metadata.createIndex({savingTime: -1}); checkret('metadata savingTime', ret);

ret = db.supporters.createIndex({ publicKey: 1 }, { unique: true }); checkret('supporters publicKey:', ret);
ret = db.supporters.createIndex({ lastActivity: 1 }); checkret('supporters lastActivity:', ret);

ret = db.groups.createIndex({ id: 1 }, { unique: true }); checkret('groups id', ret);
ret = db.groups.createIndex({ name: 1 }, { unique: true }); checkret('groups name', ret);

/* metadataId is not used to address content, if not when 'precise' parser is invoked */
ret = db.htmls.createIndex({ id: 1 }, { unique: true} ); checkret('htmls id', ret);
ret = db.htmls.createIndex({ savingTime: -1 }); checkret('htmls savingTime', ret);
ret = db.htmls.createIndex({ processed: 1 }); checkret('htmls processed', ret);

ret = db.labels.createIndex({ processed: 1 }); checkret('htmls processed', ret);

ret = db.labels.createIndex( { "savingTime": -1 }, { expireAfterSeconds: 7 * 24 * 3600 } ); checkret('labels savingTime expiring', ret);
ret = db.labels.createIndex( { "selectorName": 1 }); checkret('labels expiring', ret);

function checkret(info, retval) {
    retval.info = info;
    printjson(retval);
};
