import { ContentCreator } from '@trex/shared/models/ContentCreator';
import { Video } from '@trex/shared/models/Video';
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
import { AppError } from '@trex/shared/errors/AppError';
import { getItem } from '@trex/shared/providers/localStorage.provider';
import { API } from '../../api';
import { APIError } from '@trex/shared/errors/APIError';
import { GetRelatedChannelsOutput } from '@trex/shared/models/ChannelRelated';
import * as sharedConst from '@trex/shared/constants';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';

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
      () => new APIError('NotFound', 'Missing Content Creator', [])
    )
  );

export const auth = queryStrict(
  () => TE.fromIO<any, AppError>(getItem(sharedConst.AUTH_KEY)),
  available
);

// content creator

export const localProfile = queryStrict(
  () => TE.fromIO<any, APIError>(getItem(sharedConst.CONTENT_CREATOR)),
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

export const ccRelatedUsers = compose(
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
