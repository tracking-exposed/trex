
const nconf = require('nconf');
const params = require('./params');
const debug = require('debug')('lib:debug');

function checkPassword(req) {
    const key = params.getString(req, 'key');
    if( key !== nconf.get('key') ) {
        debug("Authentication failure, password mismatch");
        return false;
    }
    return true;
};

function checkKeyIsSet() {
    if(nconf.get('key') === 'invalid_default') {
        // eslint-disable-next-line
        console.log("key is not set, and this is not allowed");
        // eslint-disable-next-line
        console.log("Please use something like --key 'arandomstring' ");
        process.exit(1);
    }
    debug("password is set and it is not the default");
};


module.exports = {
    checkPassword,
    authError: { text: "Authentication Error" },
    checkKeyIsSet,
};
