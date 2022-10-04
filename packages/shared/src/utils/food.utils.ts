import crypto from 'crypto';
import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const foodWords = require( 'food-words');

export function string2Food(piistr: any): string {
  const numberOf = 3;
  const inputs = _.times(numberOf, function (i) {
    return _.reduce(
      i + piistr,
      function (memo, acharacter) {
        /* charCodeAt never return 0 as number */
        const x = memo * acharacter.charCodeAt(0);
        memo += x / 23;
        return memo;
      },
      1
    );
  });
  const size = _.size(foodWords);
  const ret = _.map(inputs, function (pseudornumber) {
    /* considering the calculus above would produce a
       number that might be < foodWords.length and with decimals,
       it is multiply by 1000 to be sure would be bigger than
       variable 'size' */
    return _.nth(foodWords, _.round(pseudornumber * 1000) % size);
  });
  return _.join(ret, '-');
}

export function pickFoodWord(rginput: string): string {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(`food ${rginput}`);
  const mixedseed = sha1sum.digest('hex');
  const seed = mixedseed.replace(/[a-f]/gi, '');

  /* even if statistically implausible, ensure
   * there is a number from the hexdump.replaced made above */
  const rnum =
    seed.length > 5
      ? _.parseInt(seed.substring(0, 5))
      : _.parseInt(seed) + rginput.length;

  /* and then just play with a % module */
  const wordpos = rnum % foodWords.length;
  /* debug("pickFoodWord number %d, module %d, word [%s]",
        rnum, wordpos, _.nth(foodWords, wordpos)); */
  return _.nth(foodWords, wordpos) as string;
}
