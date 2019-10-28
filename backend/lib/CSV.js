const _ = require('lodash');
const debug = require('debug')('lib:CSV');
const moment = require('moment');

function produceCSVv1(entries) {

    const keys = _.keys(entries[0]);

    let produced = _.reduce(entries, function(memo, entry, cnt) {
        if(!memo.init) {
            memo.expect = _.size(keys);
            memo.csv = _.trim(JSON.stringify(keys), '][') + "\n";
            memo.init = true;
        }

        if(_.size(keys) != memo.expect) {
            debug("Invalid JSON input: expected %d keys, got %d",
                memo.expect, _.size(keys));
            console.log(memo.csv);
            console.log(JSON.stringify(entry, undefined, 2));
            throw new Error("Format error");
        }

        _.each(keys, function(k, i) {
            let swap = _.get(entry, k, "");
            if(k == 'savingTime')
                memo.csv += moment(swap).toISOString();
            else if(_.isInteger(swap))
                memo.csv += swap;
            else if(k == 'related') {
                debugger;
                console.log(JSON.stringify(swap, undefined, 2))
                console.log("related content!");
            }
            else {
                swap = _.replace(swap, /"/g, '〃');
                swap = _.replace(swap, /'/g, '’');
                memo.csv +=  '"' + swap + '"';
            }
            if(!_.eq(i, _.size(keys) - 1))
                memo.csv += ',';
        });
        memo.csv += "\n";
        return memo;

    }, { init: false, csv: "", expect: 0 });
    return produced.csv;
};

module.exports = {
    produceCSVv1
};