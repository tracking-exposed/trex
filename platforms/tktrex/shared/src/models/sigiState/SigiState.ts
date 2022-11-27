import { MetadataBase } from '@shared/models/MetadataBase';
import * as t from 'io-ts';

export const SigiStateType = t.literal('sigiState');
export type SigiStateType = t.TypeOf<typeof SigiStateType>;

export const SigiState = t.type(
  {
    ...MetadataBase.props,
    type: SigiStateType,
  },
  'SigiState',
);
export type SigiState = t.TypeOf<typeof SigiState>;
