import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { SyncRequest } from '../models/MessageRequest';
import api from '../API/api';

export const sync = (request: SyncRequest): TE.TaskEither<Error, any> => {
  return pipe(
    TE.tryCatch(
      () => api.postEvents(request.payload, request.userId),
      E.toError
    ),
    TE.fold(
      (e): TE.TaskEither<Error, any> =>
        () =>
          Promise.resolve(E.right({ type: 'syncError', response: e })),
      (response): TE.TaskEither<Error, any> =>
        () =>
          Promise.resolve(E.right({ type: 'syncResponse', response }))
    )
  );
};
