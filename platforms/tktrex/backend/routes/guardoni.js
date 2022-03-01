const _ = require('lodash');
const debug = require('debug')('routes:guardoni');
const nconf = require('nconf');

const params = require('../lib/params');
const mongo3 = require('../lib/mongo3');
const research = require('../routes/research');

async function guardoniV2(req) {
/* this API returns an URL usable by guardoni to personalize—profile the watcher profile 
 *  /:amount/:category/:type
 *  example:
 *  /10/Anal/(fixed|random) 
 */
    const { amount, skip } = params.optionParsing(req.params.amount, 20);
    const type = req.params.type == 'fixed' ? 'fixed' : 'random';
    const category = req.params.category;

    const found = _.find(research.MACROc, { name: category });

    if(!found) {
        debug("guardoniV2 error, category %s not found", category);
        return {
            text: "Error, category requested not found. List of available categories: " + 
                _.map(research.MACROc, 'name').join('—')
        };
    } else
        debug("guardoniV2 for Category %s (%s), %d amount, type [%s]", category, found.macro, amount, type );

    const mongoc = await mongo3.clientConnect({concurrency: 2});
    const filter = { 'categories.name': category };
    const sorter = { when: type === 'fixed' ? 1 : -1 }
    const retrieved = await mongo3.readLimit(mongoc, nconf.get('schema').categories, filter, sorter, amount, skip);

    const urlList = _.map(retrieved, function(caten) {
        return "https://www.pornhub.com/view_video.php?viewkey=" + caten.videoId;
    })
    await mongoc.close();
    return { json: urlList };
}

module.exports = {
    guardoniV2,
};