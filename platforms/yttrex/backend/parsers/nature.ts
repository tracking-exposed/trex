import { ParserFn } from '@shared/providers/parser.provider';
import { HTMLSource } from '../lib/parser/html';
import { Nature } from '../models/Nature';
import { YTParserConfig } from './config';
import processHome from './home';
import { processSearch } from './searches';
import parseVideo from './video';

const processNature =
  (type: Nature['type']): ParserFn<HTMLSource, any, YTParserConfig> =>
  (e, findings, ctx) => {
    switch (type) {
      case 'video':
        return parseVideo(e, findings, ctx);
      case 'search':
        return processSearch(e, findings, ctx);
      case 'home':
        return processHome(e, findings, ctx);
      default:
        throw new Error(`Nature ${type} not handled.`);
    }
  };

/**
 * Extract the nature from given entry.
 *
 *
 */
export const nature: ParserFn<HTMLSource, Nature, YTParserConfig> = async (
  e,
  findings,
  ctx
) => {
  const type = e.html.nature.type ?? (e.html as any).type;
  const nature = await processNature(type)(e, findings, ctx);
  if (!nature) {
    throw new Error('No nature found for this entry.');
  }

  return {
    type,
    ...nature,
  };
};
