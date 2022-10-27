import { ParsedInfo, VideoMetadata } from '@yttrex/shared/models/metadata/Metadata';
import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

const { supporter, ...videoMetadataProps } = VideoMetadata.type.props;
export const VideoMetadataDB = t.type(
  {
    ...videoMetadataProps,
    _id: t.any,
    publicKey: t.string,
    savingTime: date,
    clientTime: date,
    publicationTime: date,
    related: t.array(
      t.strict(
        {
          ...ParsedInfo.type.props,
          publicationTime: t.union([date, t.null, t.undefined]),
        },
        'VideoMetadataRelated'
      )
    ),
  },
  'VideoMetadataDB'
);
export type VideoMetadataDB = t.TypeOf<typeof VideoMetadataDB>;
