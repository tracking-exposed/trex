ret = db.metadata.createIndex({id: 1}, {unique: true }); checkret('metadata id', ret);
ret = db.metadata.createIndex({videoId: 1}); checkret('metadata videoId', ret);
ret = db.metadata.createIndex({"related.videoId": 1}); checkret('metadata related.videoId', ret);
ret = db.metadata.createIndex({authorName: 1}); checkret('metadata authorName', ret);

ret = db.videos.createIndex({ id : 1 }, { unique: true }); checkret('videos id', ret);
ret = db.videos.createIndex({ savingTime : 1 }); checkret('videos savingTime', ret);

ret = db.supporters.createIndex({ publicKey: 1 }, { unique: true }); checkret('supporters publicKey:', ret);

ret = db.groups.createIndex({ id: 1 }, { unique: true }); checkret('groups id', ret);
ret = db.groups.createIndex({ name: 1 }, { unique: true }); checkret('groups name', ret);

/* version 2 */
ret = db.htmls.createIndex({ id: 1 }, { unique: true} ); checkret('htmls id', ret);


function checkret(info, retval) {
    retval.info = info;
    printjson(retval);
};
