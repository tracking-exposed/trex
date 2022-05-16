import * as t from 'io-ts';
import * as apiModel from '../../models';
import { DocumentedEndpoint } from '@shared/endpoints/utils';

const GetPersonalJSON = DocumentedEndpoint({
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/json`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: apiModel.Common.What,
    }),
  },
  Output: apiModel.Personal.PersonalVideoList,
  title: 'Personal data (json)',
  description: 'Get your personal data as JSON.',
  tags: ['personal'],
});

const GetPersonalCSV = DocumentedEndpoint({
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/csv`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: apiModel.Common.What,
    }),
  },
  Output: t.string,
  title: 'Personal data (csv)',
  description: 'Download your personal data as CSV.',
  tags: ['personal'],
});

export default {
  GetPersonalJSON,
  GetPersonalCSV,
};
