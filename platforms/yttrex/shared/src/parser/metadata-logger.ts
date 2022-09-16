import { MetadataLoggerProps } from '@shared/extension/ui/components/MetadataLogger';
import { trexLogger } from '@shared/logger';
import { ParserConfiguration } from '@shared/providers/parser.provider';
import { v4 as uuid } from 'uuid';
import { Metadata } from '../models/metadata/Metadata';
import { toMetadata } from './metadata';
import nature, { getNatureFromURL } from './parsers/nature';
import search from './parsers/searches';
import { HTMLSource } from './source';

const metadataParserLogger = trexLogger.extend('metadata-logger');

export const metadataLoggerParserProps: Omit<
  MetadataLoggerProps<HTMLSource, Metadata, ParserConfiguration, any>,
  'hub'
> = {
  parser: {
    name: 'yt-metadata',
    log: metadataParserLogger,
    addDom: (h) => ({
      ...h,
      jsdom: new DOMParser().parseFromString(h.html.html, 'text/html'),
    }),
    buildMetadata: toMetadata as any,
    parsers: {
      nature,
      search,
    },
    getEntryDate: (e) => e.html.clientTime,
    getEntryNatureType: (e) => e.html.nature.type,
    getEntryId: (e) => e.html.id,
    config: {},
  },
  decode: HTMLSource.decode,
  mapEvent: (id, e) => {
    const ev: any = e;
    if (ev.type === 'NewVideo') {
      const { element, ...payload } = ev.payload;
      return {
        html: {
          id,
          metadataId: uuid(),
          blang: '',
          publicKey: '',
          clientTime: new Date(),
          savingTime: new Date(),
          nature: getNatureFromURL(payload.href),
          counters: [],
          ...payload,
          html: element,
          processed: false,
        },
        supporter: {
          publicKey: '',
          lastActivity: new Date(),
          version: '',
          creationTime: new Date(),
          p: '',
        },
        jsdom: {},
      };
    }

    return null;
  },
};
