import { PipelineResults } from '../lib/parser/types';
import home from './home';
import searches from './searches';
import * as shared from './shared';
import video from './video';
import longlabel from './longlabel';
import thumbnail from './thumbnail';
// import uxlang from './uxlang';

/**
 * export all parsers as dictionary
 */

export function toMetadata(entry: PipelineResults | null): Metadata | null {
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry?.findings?.nature) return null;

  if (entry.findings.nature.type === 'search') {
    const metadata = {
      ...entry.findings.nature,
      ...entry.findings.downloader,
      ...entry.findings.search,
    };
    metadata.savingTime = new Date(entry.source.html.savingTime);
    metadata.id = entry.source.html.id;
    metadata.publicKey = entry.source.html.publicKey;
    return metadata;
  }

  /* else ... */
  const metadata = {
    href: entry.source.html.href,
    ...entry.findings.nature,
    ...entry.findings.description,
    ...entry.findings.music,
    ...entry.findings.hashtags,
    ...entry.findings.numbers,
    ...entry.findings.stitch,
    ...entry.findings.author,
    ...entry.findings.downloader,
  };

  metadata.savingTime = new Date(entry.source.html.savingTime);
  metadata.id = entry.source.html.id;
  metadata.publicKey = entry.source.html.publicKey;
  metadata.timelineId = entry.source.html.timelineId;

  if (Array.isArray(entry.source.html.n)) {
    metadata.order = entry.source.html.n[0];
  }
  // from routes/events.js the 0 is videoCounter, client side
  return metadata;
}

export const parsers = {
  home,
  searches,
  shared: shared.getThumbNailHref,
  longlabel: longlabel.parser,
  thumbnail,
  video,
  search: searches
};
