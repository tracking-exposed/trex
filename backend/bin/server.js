var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var moment = require('moment');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var debug = require('debug')('yttrex');
var nconf = require('nconf');
var cors = require('cors');

var utils = require('../lib/utils');
var APIs = require('../lib/api');
var mongo3 = require('../lib/mongo3');

var cfgFile = "config/settings.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv().env().file({ file: cfgFile });

console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

if(!nconf.get('interface') || !nconf.get('port') )
    throw new Error("check your config/settings.json, config of 'interface' and 'post' missing");

var returnHTTPError = function(req, res, funcName, where) {
    debug("%s HTTP error 500 %s [%s]", req.randomUnicode, funcName, where);
    res.status(500);
    res.send();
    return false;
};


/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */
function dispatchPromise(name, req, res) {

    var apiV = _.parseInt(_.get(req.params, 'version'));

    /* force version to the only supported version */
    debug("%s name %s (%s)", moment().format("HH:mm:ss"), name, req.url);

    var func = _.get(APIs.implementations, name, null);

    if(_.isNull(func)) {
        debug("Invalid function request");
        return returnHTTPError(req, res, name, "function not found?");
    }

    /* in theory here we can keep track of time */
    return new Promise.resolve(func(req))
      .then(function(httpresult) {

          if(_.isObject(httpresult.headers))
              _.each(httpresult.headers, function(value, key) {
                  debug("Setting header %s: %s", key, value);
                  res.setHeader(key, value);
              });

          if(httpresult.json) {
              debug("%s API success, returning JSON (%d bytes)",
                  name, _.size(JSON.stringify(httpresult.json)) );
              res.json(httpresult.json)
          } else {
              debug("Undetermined failure in API call, result →  %j", httpresult);
              return returnHTTPError(req, res, name, "Undetermined failure");
          }
          return true;
      })
      .catch(function(error) {
          debug("%s Trigger an Exception %s: %s",
              req.randomUnicode, name, error);
          return returnHTTPError(req, res, name, "Exception");
      });
};

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.use(bodyParser.json({limit: '4mb'}));
app.use(bodyParser.urlencoded({limit: '4mb', extended: true}));

/* the only two documented and tested APIs */
/* the only two documented and tested APIs */
app.get('/api/v1/last', function(req, res) {
    return dispatchPromise('getLast', req, res);
});
app.get('/api/v1/videoId/:query', function(req, res) {
    return dispatchPromise('getVideoId', req, res);
});
app.get('/api/v1/related/:query', function(req, res) {
    return dispatchPromise('getRelated', req, res);
});

/* the only two documented and tested APIs */
/* --------------------------------------- */

/* This is import and validate the key */
app.post('/api/v:version/validate', function(req, res) {
    return dispatchPromise('validateKey', req, res);
});
/* This to actually post the event collection */
app.post('/api/v:version/events', function(req, res) {
    return dispatchPromise('processEvents', req, res);
});

/* download your full CSV */
app.get('/api/v1/personal/:publicKey/csv', function(req, res) {
    return dispatchPromise('getPersonalCSV', req, res);
});
/* this is to retrieve the personal video submitted */
app.get('/api/v1/personal/:publicKey/:paging?', function(req, res) {
    return dispatchPromise('getPersonal', req, res);
});

app.get('/api/v1/html/:htmlId', function(req, res) {
    return dispatchPromise('unitById', req, res);
});


/* sequence API */
// app.get('/api/v1/sequence/:testId/:name', function(req, res) {
//     return dispatchPromise('getSequence', req, res);
// });
/* create a new sequence */
// app.get('/api/v1/sequence/:publicKey/:idList/:name', function(req, res) {
//     return dispatchPromise('createSequence', req, res);
// });
/* get the results of a sequence */
// app.get('/api/v1/results/:testId/:name', function(req, res) {
//     return dispatchPromise('getResults', req, res);
// });

/* divergency page */
// app.get('/[dD]/:testId/:name', function(req, res) {
//     req.params.page = 'divergency';
//     return dispatchPromise('getPage', req, res);
// });
/* divergency results page */
// app.get('/[rR]/:testId/:name', function(req, res) {
//     req.params.page = 'results';
//     return dispatchPromise('getPage', req, res);
// });

/* static files, independent by the API versioning */
app.get('/favicon.ico', function(req, res) {
    res.sendFile(__dirname + '/dist/favicon.ico');
});
app.get('/robots.txt', function(req, res) {
    res.sendFile(__dirname + '/dist/robots.txt');
});

Promise.resolve().then(function() {
    if(dbutils.checkMongoWorks()) {
        debug("mongodb connection works");
    } else {
        console.log("mongodb is not running - check", cfgFile,"- quitting");
        process.exit(1);
    }
});
