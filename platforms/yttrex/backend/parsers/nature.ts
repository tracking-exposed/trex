import { ParserFn } from '@shared/providers/parser.provider';
import { HTMLSource } from '../lib/parser/html';
import processHome from './home';
import { process as processVideo } from './video';
import { processSearch } from './searches';
import { Nature } from '../models/Nature';

const processNature = (type: Nature['type'], e: HTMLSource): any => {
  switch (type) {
    case 'video':
      return processVideo(e);
    case 'search':
      return processSearch(e);
    default:
      return processHome(e);
  }
};

/**
 * Extract the nature from given entry.
 *
 *
 */
export const nature: ParserFn<HTMLSource, Nature> = async (e) => {
  const type = e.html.nature.type ?? (e.html as any).type;
  const nature = processNature(type, e);
  if (!nature) {
    throw new Error('No nature found for this entry.');
  }
  return {
    type,
    ...nature,
  };
};
