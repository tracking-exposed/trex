import * as t from 'io-ts';
import { parseHTML } from 'linkedom';

export const SearchTopMetaData = t.type(
  {
    _id: t.union([t.string, t.undefined]),
    type: t.literal('SearchTopMetaData'),
    snapshotId: t.union([t.string, t.undefined]),
    position: t.number,
    description: t.string,
    hashtags: t.array(t.string),
  },
  'SearchTopMetaData'
);
export type SearchTopMetaData = t.TypeOf<typeof SearchTopMetaData>;

export const parseSearchTop = (html: string): SearchTopMetaData[] => {
  const selectors = {
    searchTopItem: '[data-e2e="search_top-item"]',
    description: '[data-e2e="search-card-video-caption"]',
  };

  const { document } = parseHTML(html);

  return Array.from(document.querySelectorAll(selectors.searchTopItem)).map(
    (el, position) => {
      const descriptionEl = el.parentElement?.querySelector(
        selectors.description
      );

      if (!descriptionEl) {
        throw new Error('could not find description element');
      }
      const description = descriptionEl.textContent ?? '';

      const hashtags = Array.from(descriptionEl.querySelectorAll('a'))
        .filter((el) => (el as any).href.startsWith('/tag'))
        .map((el) => (el as any).textContent.trim());

      return {
        _id: undefined,
        type: 'SearchTopMetaData',
        snapshotId: undefined,
        position,
        description,
        hashtags,
      };
    }
  );
};
