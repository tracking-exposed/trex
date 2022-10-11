import { ContentCreator } from '@shared/models/ContentCreator';
import { Video } from '@shared/models/Video';
import {
  available,
  compose,
  param,
  product,
  queryShallow,
  queryStrict,
} from 'avenger';
import { formatISO, subMonths } from 'date-fns';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { AppError } from '@shared/errors/AppError';
import { getItem, setItem } from '@shared/providers/localStorage.provider';
import { APIError } from '@shared/errors/APIError';
import { GetRelatedChannelsOutput } from '@shared/models/ChannelRelated';
import * as sharedConst from '@shared/constants';
import { MakeAPIClient } from '@shared/providers/api.provider';
import * as endpoints from '@yttrex/shared/endpoints';
import { config } from '../../config';
import { AuthResponse } from '@shared/models/Auth';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';
export const ACCOUNT_LINK_COMPLETED = 'account-link-completed';

const logout = async (): Promise<void> => {
  setItem(sharedConst.CONTENT_CREATOR, null)();

  await profile.invalidate()();
  await localProfile.invalidate()();
};

export const { API, HTTPClient } = MakeAPIClient(
  {
    baseURL: config.API_URL,
    getAuth: (req) => {
      return pipe(
        localProfile.run(),
        TE.filterOrElse(
          (s): s is AuthorizedContentCreator => s !== null,
          () => new Error('Auth is null')
        ),
        TE.fold(
          (e) => async () => {
            return Promise.reject(e);
          },
          (a) => async () => {
            req.headers = {
              ...req.headers,
              'x-authorization': a.accessToken,
            };
            return req;
          }
        )
      )();
    },
    onUnauthorized: async (res) => {
      await logout();
      return res;
    },
  },
  endpoints
);

type AuthorizedContentCreator = Omit<ContentCreator, 'accessToken'> & {
  accessToken: string;
};

const throwOnMissingProfile = (
  profile?: ContentCreator | null
): TE.TaskEither<APIError, AuthorizedContentCreator> =>
  pipe(
    profile,
    TE.fromPredicate(
      (s): s is AuthorizedContentCreator =>
        s?.registeredOn !== undefined && s.accessToken !== undefined,
      () => new APIError(404, 'NotFound', 'Missing Content Creator', [])
    )
  );

export const auth = queryStrict(
  () => TE.fromIO<AuthResponse | null, AppError>(getItem(sharedConst.AUTH_KEY)),
  available
);

export const accountLinkCompleted = queryStrict(
  () => TE.fromIO<any, APIError>(getItem(ACCOUNT_LINK_COMPLETED)),
  available
);

// content creator

export const localProfile = queryStrict(
  () =>
    TE.fromIO<AuthorizedContentCreator | null, APIError>(
      getItem(sharedConst.CONTENT_CREATOR)
    ),
  available
);

export const requiredLocalProfile = compose(
  product({ profile: localProfile }),
  queryStrict(({ profile }) => pipe(profile, throwOnMissingProfile), available)
);

export const profile = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(
    ({ profile }) =>
      pipe(
        API.v3.Creator.GetCreator({
          Headers: { 'x-authorization': profile.accessToken },
        }),
        TE.chain(throwOnMissingProfile)
      ),
    available
  )
);

export const creatorRecommendations = compose(
  product({ profile: requiredLocalProfile, params: param() }),
  queryStrict(
    ({ profile }) =>
      API.v3.Creator.CreatorRecommendations({
        Headers: { 'x-authorization': profile.accessToken },
      }),
    available
  )
);

export const creatorVideos = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(({ profile }): TE.TaskEither<Error, Video[]> => {
    return API.v3.Creator.CreatorVideos({
      Headers: { 'x-authorization': profile.accessToken },
    });
  }, available)
);

export const oneCreatorVideo = compose(
  product({
    profile: requiredLocalProfile,
    params: param<{ videoId: string }>(),
  }),
  queryShallow(({ profile, params }): TE.TaskEither<Error, Video> => {
    return API.v3.Creator.OneCreatorVideo({
      Headers: { 'x-authorization': profile.accessToken },
      Params: { videoId: params.videoId },
    });
  }, available)
);

export const YCAIccRelatedUsers = compose(
  product({
    profile: requiredLocalProfile,
    params: param<{ amount: number; skip: number }>(),
  }),
  queryShallow(
    ({ profile, params }): TE.TaskEither<Error, GetRelatedChannelsOutput> => {
      return API.v3.Creator.CreatorRelatedChannels({
        Headers: {
          'x-authorization': profile.accessToken,
        },
        Params: {
          channelId: profile.channelId,
        },
        Query: {
          amount: params.amount,
          skip: params.skip,
        },
      });
    },
    available
  )
);

export const creatorStats = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(({ profile }) => {
    return pipe(
      API.v3.Creator.GetCreatorStats({
        Params: { channelId: profile.channelId },
      })
    );
  }, available)
);

export const creatorADVStats = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(({ profile }) => {
    return pipe(
      API.v2.Public.GetChannelADVStats({
        Params: {
          channelId: profile.channelId,
          // TODO: move this to params given by caller
        },
        Query: {
          since: formatISO(subMonths(new Date(), 1), {
            representation: 'date',
          }),
          till: formatISO(new Date(), { representation: 'date' }),
        },
      })
    );
  }, available)
);
