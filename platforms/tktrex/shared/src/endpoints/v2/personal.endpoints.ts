import * as t from 'io-ts';
import * as apiModel from '../../models';
import { DocumentedEndpoint } from '@shared/endpoints';
import { PersonalData } from '../../models/personal';

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

const GetPersonalByExperiment = DocumentedEndpoint({
  title: 'Personal data by experiment id',
  description: 'Get personal data by the given experiment id',
  tags: ['personal'],
  Method: 'GET',
  getPath: ({ publicKey, experimentId, format }) =>
    `/v2/personal/${publicKey}/experiment/${experimentId}/${format}`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      experimentId: t.string,
      format: apiModel.Common.Format,
    }),
  },
  Output: PersonalData,
});

export default {
  GetPersonalJSON,
  GetPersonalCSV,
  GetPersonalByExperiment,
};
