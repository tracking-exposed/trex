import { ParserFn } from '@shared/providers/parser.provider';
import { HTMLSource } from '../lib/parser/html';
import processHome from './home';
import parseVideo from './video';
import { processSearch } from './searches';
import { Nature } from '../models/Nature';

const processNature = (type: Nature['type'], e: HTMLSource): any => {
  switch (type) {
    case 'video':
      return parseVideo(e);
    case 'search':
      return processSearch(e);
    case 'home':
      return processHome(e);
    default:
      throw new Error(`Nature ${type} not handled.`);
  }
};

/**
 * Extract the nature from given entry.
 *
 *
 */
export const nature: ParserFn<HTMLSource, Nature> = async (e) => {
  const type = e.html.nature.type ?? (e.html as any).type;
  const nature = await processNature(type, e);
  if (!nature) {
    throw new Error('No nature found for this entry.');
  }

  return {
    type,
    ...nature,
  };
};
