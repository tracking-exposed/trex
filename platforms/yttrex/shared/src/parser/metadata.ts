import { BuildMetadataFn } from '@shared/providers/parser.provider';
import { isValid } from 'date-fns';
import { Parsers } from './parsers';
import { HTMLSource } from './source';

export const toMetadata: BuildMetadataFn<HTMLSource, Metadata, Parsers> = (
  entry,
  oldMetadata
) => {
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry?.findings?.nature) return null;

  let metadata: any = {};
  metadata.savingTime = isValid(entry.source.html.savingTime)
    ? entry.source.html.savingTime
    : new Date(entry.source.html.savingTime);
  metadata.clientTime = isValid(entry.source.html.clientTime)
    ? entry.source.html.clientTime
    : new Date(entry.source.html.clientTime);
  metadata.id = entry.source.html.metadataId;
  metadata.publicKey = entry.source.html.publicKey;

  if (
    entry.source.html.experimentId &&
    entry.source.html.experimentId.length > 0
  ) {
    metadata.experimentId = entry.source.html.experimentId;
  }

  if (
    entry.source.html.researchTag &&
    entry.source.html.researchTag.length > 0
  ) {
    metadata.researchTag = entry.source.html.researchTag;
  }

  if (entry.findings.nature.type === 'search') {
    metadata = {
      ...entry.findings.nature,
      nature: entry.findings.nature,
      ...metadata,
    };

    return metadata;
  }
  if (entry.findings.nature.type === 'video') {
    const videoNature: any = entry.findings.nature;
    const oldMetadataAny: any = oldMetadata;
    const related = videoNature.related.reduce((acc: any[], m) => {
      const index = acc.findIndex(
        (r) =>
          r.videoId === m.videoId || (r.params?.v && r.params.v === m.videoId)
      );
      if (index > -1) {
        acc[index] = {
          ...acc[index],
          ...m,
          index: acc[index].index,
        };
        return acc;
      }

      return acc.concat(m);
    }, oldMetadataAny?.related ?? []);

    metadata = {
      href: entry.source.html.href,
      ...entry.findings.nature,
      nature: entry.findings.nature,
      ...metadata,
      related,
    };
    return metadata;
  }

  metadata = {
    ...entry.findings.nature,
    nature: entry.findings.nature,
    href: entry.source.html.href,
    ...metadata,
  };

  if (Array.isArray(entry.source.html.n)) {
    metadata.order = entry.source.html.n[0];
  }

  // from routes/events.js the 0 is videoCounter, client side
  return metadata;
};
