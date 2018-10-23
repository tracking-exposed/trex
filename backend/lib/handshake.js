var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:handshake');
var os = require('os');
var fs = Promise.promisifyAll(require('fs'));
var nconf = require('nconf');

var signer = require('nacl-signature');
var bs58 = require('bs58');

var mongo = require('./mongo');
var utils = require('./utils');
var events = require('./events');


function handshake(req) {

    var headers = events.processHeaders(_.get(req, 'headers'), events.hdrs);

    if(_.get(headers, 'error')) {
        debug("Error detected: %s", headers.error);
        return { 'json': {
            'status': 'error',
            'info': headers.error
        }};
    }

    return mongo
        .read(nconf.get('schema').supporters, {
            publicKey: headers.publickey
        })
        .then(function(supporterL) {
            if(!_.size(supporterL))
                return events.TOFU(headers.publickey);
            else
                return supporterL;
        })
        .then(_.first)
        .then(function(supporter) {
            if (!utils.verifyRequestSignature(req)) {
                debug("Verification fail for use [%s] (signature %s)",
                    supporter.p, headers.signature);
                throw new Error('Signature does not match request body');
            }
            supporter.version = headers.version;
            supporter.lastActivity = new Date();
            return supporter;
        })
        .tap(function(supporter) {
            return mongo.updateOne(nconf.get('schema').supporters, {
                publicKey: supporter.publickey
            }, supporter);
        })
        .then(function(supporter) {
            return mongo
                .read(nconf.get('schema').sequences, { testId: _.parseInt(req.body.testId), first: true })
                .tap(function(rets) {
                    debug("found %d videos from the sequence requested, %s wants to commit", _.size(rets), supporter.p);
                })
                .map(function(selection) {
                    return {
                        videoId: selection.videoId,
                        p: supporter.p,
                        commitTime: new Date(),
                        testId: req.body.testId
                    };
                });
        })
        .then(function(commitments) {
            return mongo
                .writeMany(nconf.get('schema').commitments, commitments)
                .return(_.first(commitments).p)
                .catch(function(error) {
                    /* message: 'E11000 duplicate key error collection --- this happen when the
                     * person refresh/reload the page, we don't save this, as long as the thing
                     * is alive */
                    if(error.code === 11000)
                        return _.first(commitments).p;

                    throw error;
                });

        })
        .then(function(pseudonym) {
            /* it return the pseudonym to be printed in /d/$testId/$name span#userName */
            return { json: {
                    p: pseudonym
                }
            };
        })
        .catch(function(error) {
            debug("Error in managing handshake: %s", error.message);
            return { json: {
                status: 'error',
                info: error.message
            }};
        });
};

module.exports = {
    handshake: handshake
};
