import * as Query from './query';
import * as Search from './Search';
import { TKHeaders } from './TKHeaders';
import * as Output from './output';
import * as Body from './body';

export default {
  Headers: { TKHeaders },
  Query: { ...Query, Search },
  Body,
  Output: { ...Output },
};
