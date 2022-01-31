import { GetEndpointSubscriber } from 'ts-endpoint-express';
import { IOError } from 'ts-io-error/lib';

export const AddEndpoint = GetEndpointSubscriber((e): IOError => {
  return {
    name: 'EndpointError',
    status: 500,
    message: 'Unknown error',
    details: {
      kind: 'DecodingError',
      errors: e,
    },
  };
});
