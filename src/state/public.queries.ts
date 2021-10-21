import { Recommendation } from '@backend/models/Recommendation';
import {
  available,
  compose,
  product,
  queryShallow,
  queryStrict,
  refetch,
} from 'avenger';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { Settings } from 'models/Settings';
import { Messages } from '../models/Messages';
import { API } from '../providers/api.provider';
import { sendMessage, toBrowserError } from '../providers/browser.provider';

export const popupSettings = queryShallow(() => {
  return sendMessage(Messages.GetSettings)();
}, available);

export const settings = compose(
  product({ popupSettings }),
  queryShallow(({ popupSettings }) => {
    return pipe(
      popupSettings,
      TE.fromPredicate(
        (r): r is Settings => r !== undefined,
        () => toBrowserError(new Error())
      )
    );
  }, available)
);

export const keypair = queryStrict(() => {
  return sendMessage(Messages.GetKeypair)();
}, refetch);

// public

export const videoRecommendations = queryShallow(
  ({ videoId }: { videoId: string }): TE.TaskEither<Error, Recommendation[]> =>
    API.Public.VideoRecommendations({ Params: { videoId } }),
  available
);
