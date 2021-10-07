const _ = require('lodash');
const debug = require('debug')('lib:basic');
const nconf = require('nconf');
const Promise = require('bluebird');

/* still to be migrated */
const mongo = require('./mongo');
const automo = require('./automo');

/* This api simply return the basic last 69 videos */
function all(req) {
    return mongo
        .readLimit(nconf.get('schema').videos, { type: "video"}, { savingTime: -1}, 69, 0)
        .map(function(e) {
            return _.omit(e, ['_id']);
        })
        .then(function(results) {
            debug("Returning %d videes", _.size(results));
            return { json: results };
        });
};

function selected(req) {
    const pseudo = req.params.pseudo;
    debug("Requested video selection for %s", pseudo);
    return mongo
        .readLimit(nconf.get('schema').videos, {p: pseudo}, { savingTime: -1}, 69, 0)
        .map(function(e) {
            return _.omit(e, ['_id']);
        })
        .then(function(results) {
            debug("Returning %d videes", _.size(results));
            return { json: results };
        });
};

async function radar(req) {
    let a, b;
    try {
        const expectedtwo = req.params.pseudos;
        a = expectedtwo.split(',')[0];
        b = expectedtwo.split(',')[1];
    } catch(error) { }

    if(!a || !b) {
        debug("Lack of the proper parameters");
        return { json: {
            success: false,
            message: "error, it is necessary this format: /api/v1/radar/user-pseudo-first,other-user-pseudo" 
        }};
    }

    const first = await automo.getMetadataByPublicKey(a, { amount: 69 , skip: 0 });
    const second = await automo.getMetadataByPublicKey(b, { amount: 69 , skip: 0 });

    debug(_.size(first.metadata), _.size(second.metadata));

    if( _.size(first.metadata) < 2 || _.size(second.metadata) < 2)
        return { json: {
            error: true,
            reason: "Not enough videos associated to one of the two pseudonyms"
        }}

    const results = {};
    const name1 = first.supporter.p;
    const name2 = second.supporter.p;

    results.pseudos = [ name1, name2 ];

    let catfirst = _.flatten(_.map(first.metadata, 'categories'));
    let catsecond = _.flatten(_.map(second.metadata, 'categories'));
    let categories = _.concat(catfirst, catsecond);

    results.list = _.reverse(_.sortBy(_.map(_.countBy(categories), function(c, n) { return { c, n, } }), 'c'));

    let considered = _.map(_.take(results.list, 20), 'n');

    const axes1 = _.map(considered, function(cat) {
        let ref = _.countBy(catfirst);
        let amount = _.get(ref, cat, 0);
        let value = _.round(amount / _.size(first.metadata), 2);
        return {
            axis: cat,
            value
        };
    });
    const axes2 = _.map(considered, function(cat) {
        let ref = _.countBy(catsecond);
        let amount = _.get(ref, cat, 0);
        let value = _.round(amount / _.size(second.metadata), 2);
        return {
            axis: cat,
            value
        };
    });

    results.tops = [{
        name: name1,
        axes: axes1,
    }, {
        name: name2,
        axes: axes2,
    }];

    /* results contains 'list', 'pseudos', 'tops' */
    return { json: results };
};


module.exports = {
    all: all,
    selected: selected,
    radar: radar,
};
