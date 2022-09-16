import { MetadataLoggerProps } from '@shared/extension/ui/components/MetadataLogger';
import { trexLogger } from '@shared/logger';
import { ParserConfiguration } from '@shared/providers/parser.provider';
import { v4 as uuid } from 'uuid';
import { TKMetadata } from '../models/metadata/index';
import { toMetadata } from './metadata';
import { parsers } from './parsers';
import { HTMLSource } from './source';

const metadataLogger = trexLogger.extend('tk:parser');

export const metadataLoggerProps: Omit<
  MetadataLoggerProps<HTMLSource, TKMetadata, ParserConfiguration, any>,
  'hub'
> = {
  parser: {
    name: 'tk:parser',
    log: metadataLogger,
    parsers,
    addDom: (h) => ({
      ...h,
      jsdom: new DOMParser().parseFromString(h.html.html, 'text/html'),
    }),
    getEntryId: (e) => e.html.id,
    getEntryDate: (e) => e.html.savingTime,
    getEntryNatureType: (e) => e.html.nature?.type ?? e.html.type,
    buildMetadata: toMetadata,
    config: {},
  },
  decode: HTMLSource.decode,
  mapEvent(id, e) {
    metadataLogger.debug('Map event %O', e);
    const ev: any = e;

    return {
      html: {
        ...ev.payload,
        id,
        metadataId: uuid(),
        blang: '',
        counters: [],
        clientTime: new Date(),
        savingTime: new Date(),
        publicKey: '',
        type: ev.type,
        videoId: '',
        authorId: '',
        processed: false,
        nature: { type: ev.type }
      },
      supporter: {
        publicKey: '',
        version: '',
        lastActivity: new Date(),
        creationTime: new Date(),
        p: '',
      },
      jsdom: {},
    };
  },
};
