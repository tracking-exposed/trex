import * as t from 'io-ts';

export const Metadata = t.strict({

}, 'MetadataDB');

export type Metadata = t.TypeOf<typeof Metadata>