import { AppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import { string2Food } from '@shared/utils/food.utils';
import { SigiState } from '@tktrex/shared/models';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { APIRequestEventDB } from '../models/APIRequest';

export const toSigiState = ({
  publicKey,
  id,
  experimentId,
  ...d
}: APIRequestEventDB): E.Either<AppError, SigiState.SigiState> => {
  const result = {
    ...d,
    id: id.substring(0, 10),
    supporter: string2Food(publicKey),
    experimentId: experimentId ?? undefined,
  };

  return pipe(
    SigiState.SigiState.decode(result),
    E.mapLeft((e) => toValidationError('API Request validation failed', e))
  );
};
