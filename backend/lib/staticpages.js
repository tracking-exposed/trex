var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:staticpages');
var pug = require('pug');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

var pugCompiler = function(filePrefix) {
    return pug.compileFile(
        __dirname + '/../sections/' + filePrefix + '.pug', {
            pretty: true,
            debug: false
        }
    );
};

var pageMap = {
  'revision': pugCompiler('revision'),
  'howitworks': pugCompiler('howitworks'),
  'personal': pugCompiler('personal/landing'),
  'divergency': pugCompiler('divergency'),
  'results': pugCompiler('results'),
  'privacy-statement': pugCompiler('privacy'),
  'technicalities': pugCompiler('technicalities'),
  'about-us': pugCompiler('about'),
  '/': pugCompiler('index'),
  '404': pugCompiler('404')
};

var getPage = function(req) {

    var pageName = _.get(req.params, 'page', '/');

    if(_.isUndefined(_.get(pageMap, pageName))) {
        debug("getPage '%s': not found", pageName);
        pageName = '404';
    } else {
        debug("getPage %s", pageName);
    }

    return { 
        'text': pageMap[pageName]()
    };
};


module.exports = {
    getPage: getPage
};
