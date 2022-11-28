import { AppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import { string2Food } from '@shared/utils/food.utils';
import { APIRequest } from '@tktrex/shared/models/apiRequest/APIRequest';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { APIRequestEventDB } from 'models/APIRequest';

export const toAPIRequest = ({
  publicKey,
  id,
  experimentId,
  ...d
}: APIRequestEventDB): E.Either<AppError, APIRequest> => {
  const result = {
    ...d,
    id: id.substring(0, 10),
    supporter: string2Food(publicKey),
    experimentId: experimentId ?? undefined,
  };

  return pipe(
    APIRequest.decode(result),
    E.mapLeft((e) => toValidationError('API Request validation failed', e))
  );
};
