import { BuildMetadataFn } from '@shared/providers/parser.provider';
import { TKMetadata } from '../models/Metadata';
import { TKParsers } from './parsers';
import { HTMLSource } from './source';
import { isValid } from 'date-fns';
import _ from 'lodash';

export const toMetadata: BuildMetadataFn<HTMLSource, TKMetadata, TKParsers> = (
  entry,
) => {
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry?.findings?.nature) return null;

  let metadata: any = {
    clientTime: entry.source.html.clientTime,
    thumbnails: [],
  };

  switch (entry.findings.nature.type) {
  case 'foryou': {
    const {
      nature,
      author,
      description,
      hashtags,
      metrics,
      music,
      downloader,
    } = entry.findings;
    metadata = {
      ...metadata,
      ...nature,
      nature,
      ...description,
      author,
      metrics,
      music,
      hashtags,
      ...downloader,
    };
    break;
  }
  case 'search': {
    const { nature, downloader, search } = entry.findings;
    metadata = {
      ...metadata,
      ...nature,
      nature,
      ...downloader,
      ...search,
    };
    metadata.query = _.toLower(metadata.query);
    metadata.nature.query = metadata.query;
    break;
  }
  case 'profile': {
    const { nature, profile, downloader } = entry.findings;
    metadata = {
      ...metadata,
      nature,
      ...nature,
      ...downloader,
      ...profile,
    };
    break;
  }
  case 'video':
  case 'native': {
    const {
      nature,
      description,
      music,
      hashtags,
      metrics,
      stitch,
      author,
      downloader,
      native,
    } = entry.findings;
    metadata = {
      ...nature,
      nature,
      ...description,
      music,
      hashtags,
      metrics,
      stitch,
      author,
      ...downloader,
      ...native,
    };
    break;
  }
  default: {
    metadata = {
      ...metadata,
      ...entry.findings,
      ...entry.findings.nature,
    };
  }
  }

  /* fixed fields */
  metadata.savingTime = isValid(entry.source.html.savingTime)
    ? entry.source.html.savingTime.toISOString()
    : entry.source.html.savingTime;
  metadata.clientTime = isValid(entry.source.html.clientTime)
    ? entry.source.html.clientTime.toISOString()
    : entry.source.html.clientTime;
  metadata.id = entry.source.html.id;
  metadata.publicKey = entry.source.html.publicKey;
  metadata.timelineId = entry.source.html.timelineId;
  metadata.order = entry.source.html.n?.[0];

  /* optional fields */
  if (entry.source.html.geoip?.length === 2)
    metadata.geoip = entry.source.html.geoip;
  if (entry.source.html.researchTag?.length)
    metadata.researchTag = entry.source.html.researchTag;
  if (entry.source.html.experimentId?.length)
    metadata.experimentId = entry.source.html.experimentId;

  return metadata;
};
