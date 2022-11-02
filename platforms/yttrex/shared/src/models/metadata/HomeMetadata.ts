import * as t from 'io-ts';
import { HomeN } from '../Nature';
import { MetadataBase } from './MetadataBase';
import { ParsedInfo } from './VideoResult';

export const HomeMetadata = t.strict(
  {
    ...MetadataBase.type.props,
    ...HomeN.type.props,
    selected: t.array(ParsedInfo),
    sections: t.array(
      t.type({
        i: t.number,
        offset: t.number,
      })
    ),
    login: t.union([t.boolean, t.null]),
  },
  'HomeMetadata'
);
export type HomeMetadata = t.TypeOf<typeof HomeMetadata>;
