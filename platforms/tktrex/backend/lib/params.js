import _ from 'lodash';
import createDebug from 'debug';

const debug = createDebug('lib:params');

export function getInt(req, what, def) {
  let rv = _.parseInt(_.get(req.params, what));
  if (_.isNaN(rv)) {
    if (!_.isUndefined(def)) rv = def;
    else {
      debug('getInt: Error with parameter [%s] in %j', what, req.params);
      rv = 0;
    }
  }
  return rv;
}

export function getString(req, what) {
  const rv = _.get(req.params, what);
  if (_.isUndefined(rv)) {
    debug('getString: Missing parameter [%s] in %j', what, req.params);
    return '';
  }
  return rv;
}

export function optionParsing(amountString, max) {
  const maxObjs = max || 2000;

  try {
    const amount = _.parseInt(_.first(amountString.split('-')) ?? maxObjs);
    const skip = _.parseInt(_.last(amountString.split('-')) ?? '0');
    return {
      amount,
      skip,
    };
  } catch (error) {}

  return {
    amount: maxObjs,
    skip: 0,
  };
}
