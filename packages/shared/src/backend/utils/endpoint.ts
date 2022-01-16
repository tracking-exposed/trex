import { GetEndpointSubscriber } from 'ts-endpoint-express';
import { IOError } from 'ts-io-error/lib';
import { failure } from 'io-ts/lib/PathReporter';

export const AddEndpoint = GetEndpointSubscriber((e: unknown[]): IOError => {
  console.log(failure(e as any[]));

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
