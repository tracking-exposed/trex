ret = db.urls.createIndex({ urlId: 1 }, { unique: true });
checkret('urls urlId', ret);
ret = db.urls.createIndex({ savingTime: -1 });
checkret('urls savingTime', ret);

ret = db.runs.createIndex({ runId: 1 }, { unique: true });
checkret('runs runId', ret);
ret = db.runs.createIndex({ savingTime: -1 });
checkret('runs savingTime', ret);
ret = db.runs.createIndex({ urlId: 1 });
checkret('runs urlId', ret);
ret = db.runs.createIndex({ runAt: -1 });
checkret('runs runAt', ret);

ret = db.results.createIndex({ urlId: 1 });
checkret('results urlId', ret);
ret = db.results.createIndex({ savingTime: -1 });
checkret('results savingTime', ret);

function checkret(info, retval) {
  retval.info = info;
  printjson(retval);
}
