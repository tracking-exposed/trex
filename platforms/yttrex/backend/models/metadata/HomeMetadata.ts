import { HomeMetadata, ParsedInfo } from '@yttrex/shared/models/metadata/Metadata';
import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

const { supporter, ...homeMetadataProps } = HomeMetadata.type.props;
export const HomeMetadataDB = t.type(
  {
    ...homeMetadataProps,
    _id: t.any,
    publicKey: t.string,
    savingTime: date,
    clientTime: date,
    selected: t.array(
      t.strict(
        {
          ...ParsedInfo.type.props,
          title: t.union([t.string, t.null]),
          views: t.union([t.number, t.null]),
          recommendedViews: t.union([t.number, t.null]),
          parameter: t.union([t.string, t.undefined, t.null]),
          params: t.union([t.any, t.null]),
          recommendedDisplayL: t.union([t.string, t.null]),
          recommendedThumbnail: t.union([t.string, t.null]),
          publicationTime: t.union([date, t.null, t.undefined]),
        },
        'HomeSelectedVideo'
      )
    ),
  },
  'HomeMetadataDB'
);
export type HomeMetadataDB = t.TypeOf<typeof HomeMetadataDB>;
