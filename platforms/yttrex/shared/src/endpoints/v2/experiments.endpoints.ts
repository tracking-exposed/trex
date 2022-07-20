import {
  CreateExperimentResponse, GetPublicDirectivesOutput
} from '@shared/models/Experiment';
import { HandshakeBody } from '@shared/models/HandshakeBody';
import { Step } from '@shared/models/Step';
import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';

const Handshake = Endpoint({
  Method: 'POST',
  getPath: () => `/v2/handshake`,
  Input: {
    Body: HandshakeBody,
  },
  Output: t.any,
});

const PostDirective = Endpoint({
  Method: 'POST',
  getPath: () => `/v2/directives`,
  Input: {
    Headers: t.type({
      'Content-Type': t.string,
    }),
    Body: t.array(Step),
  },
  Output: CreateExperimentResponse,
});

const GetDirective = Endpoint({
  Method: 'GET',
  getPath: ({ experimentId }) => `/v2/directives/${experimentId}`,
  Input: {
    Params: t.type({
      experimentId: t.string,
    }),
  },
  Output: t.array(Step),
});

const GetPublicDirectives = Endpoint({
  Method: 'GET',
  getPath: () => `/v2/directives/public`,
  Output: GetPublicDirectivesOutput,
});

const Experiments = {
  Handshake,
  GetDirective,
  PostDirective,
  GetPublicDirectives,
};

export default Experiments;