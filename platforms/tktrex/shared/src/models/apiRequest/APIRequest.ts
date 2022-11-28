import { MetadataBase } from '@shared/models/MetadataBase';
import * as t from 'io-ts';
import { APIRequestContributionEvent } from '../contribution/APIRequestContributionEvent';

export const APIRequest = t.strict(
  {
    ...APIRequestContributionEvent.type.props,
    ...MetadataBase.props,
  },
  'APIRequest',
);
export type APIRequest = t.TypeOf<typeof APIRequest>;
