import { failure } from 'io-ts/lib/PathReporter';
import { GetEndpointSubscriber } from 'ts-endpoint-express';
import { IOError } from 'ts-io-error/lib';

const toError = (e: unknown): IOError => {
  // console.log(e);
  if (Array.isArray(e) && e[0].context !== undefined) {
    return {
      name: 'Validation Error',
      status: 400,
      message: 'Error during validation',
      details: {
        kind: 'DecodingError',
        errors: failure(e),
      },
    };
  }

  return {
    name: 'EndpointError',
    status: 500,
    message: 'Unknown error',
    details: {
      kind: 'DecodingError',
      errors: [],
    },
  };
};

export const AddEndpoint = GetEndpointSubscriber(toError);
