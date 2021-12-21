ret = db.metadata2.createIndex({id: 1}, {unique: true }); checkret('metadata id', ret);
ret = db.metadata2.createIndex({videoId: 1}); checkret('metadata videoId', ret);
ret = db.metadata2.createIndex({"sections.videos.videoId": 1}); checkret('metadata sections.videos.href', ret);
ret = db.metadata2.createIndex({authorName: 1}); checkret('metadata authorName', ret);
ret = db.metadata2.createIndex({publicKey: 1}); checkret('metadata publicKey', ret);
ret = db.metadata2.createIndex({savingTime: -1}); checkret('metadata savingTime', ret);
ret = db.metadata2.createIndex({type: -1}); checkret('metadata type', ret);

ret = db.supporters.createIndex({ publicKey: 1 }, { unique: true }); checkret('supporters publicKey:', ret);

ret = db.htmls.createIndex({ id: 1 }, { unique: true} ); checkret('htmls id', ret);
ret = db.htmls.createIndex({ savingTime: -1 }); checkret('htmls savingTime', ret);
ret = db.htmls.createIndex({ publicKey: -1 }); checkret('htmls publicKey', ret);
ret = db.htmls.createIndex({ metadataId: -1 }); checkret('htmls metadataId', ret);
ret = db.htmls.createIndex({ processed: 1 }); checkret('htmls processed', ret);

ret = db.retrieved.createIndex({ videoId: 1 }, { unique: true} ); checkret('retrieved videoId', ret);
ret = db.retrieved.createIndex({ when: -1 }); checkret('retrieved when', ret);

ret = db.categories.createIndex({ videoId: 1 }, { unique: true} ); checkret('categories videoId', ret);
ret = db.categories.createIndex({ when: -1 }); checkret('categories when', ret);

function checkret(info, retval) {
    retval.info = info;
    printjson(retval);
};
