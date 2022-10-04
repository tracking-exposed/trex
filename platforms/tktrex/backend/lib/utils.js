const _ = require('lodash');
const debug = require('debug')('lib:utils');
const nacl = require('tweetnacl');
const {
  decodeFromBase58,
  decodeString,
  encodeToBase58,
} = require('@shared/utils/decode.utils');

function verifyRequestSignature(req) {
  // Warning: this is a duplication, also in events the
  // header list is defined, no sense specify here the key names:
  const publicKey = req.headers['x-tktrex-publickey'];
  const signature = req.headers['x-tktrex-signature'];
  let message = req.body;

  // FIXME: apparently with Express 4 the body is a streamed buffer,
  // and I don't want to dig in that now. My "There I Fix It" solution
  // is to dump the json of the body in a string, and use that to verify
  // the signature.
  //
  //   WARNING!!!
  //   This works good when the client sending the data is in JavaScript
  //   as well, since key order is given by the insertion order.

  if (req.headers['content-type'] === 'application/json')
    message = JSON.stringify(req.body);
  // this should always be the case as we use the express JSON-body middleware

  return nacl.sign.detached.verify(
    decodeString(message),
    decodeFromBase58(signature),
    decodeFromBase58(publicKey)
  );
}

function getInt(req, what, def) {
  const rv = _.parseInt(_.get(req.params, what));
  if (_.isNaN(rv)) {
    if (!_.isUndefined(def)) return def;
    else {
      debug('getInt: Error with parameter [%s] in %j', what, req.params);
      throw new Error('Invalid integer in params ' + req.params[what]);
    }
  }
  return rv;
}

function getString(req, what) {
  const rv = _.get(req.params, what);
  if (_.isUndefined(rv)) {
    debug('getString: Missing parameter [%s] in %j', what, req.params);
    return '';
  }
  return rv;
}

module.exports = {
  stringToArray: decodeString,
  encodeToBase58,
  decodeFromBase58,
  verifyRequestSignature,
  getInt,
  getString,
};
