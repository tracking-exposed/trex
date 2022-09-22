import { ParserFn } from '@shared/providers/parser.provider';
import { Nature } from '@tktrex/shared/models/Nature';
import { HTMLSource } from '../lib/parser';
import { TKParserConfig } from './config';
import { getNatureByHref } from './shared';

const nature: ParserFn<HTMLSource, Nature, TKParserConfig> = async (
  envelop,
  previous
) => {
  /* this parser is meant to analye the URL
   * and understand which kind of nature has this html */
  return getNatureByHref(envelop.html.href);
};

export default nature;
