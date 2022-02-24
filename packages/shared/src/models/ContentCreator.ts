import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
import { Video } from './Video';

const ChannelType = t.literal('channel');

export const RegisterContentCreatorBody = t.type(
  {
    type: ChannelType,
  },
  'RegisterContentCreatorBody'
);
export type RegisterContentCreatorBody = t.TypeOf<
  typeof RegisterContentCreatorBody
>;

export const ContentCreator = t.strict(
  {
    channelId: t.string,
    username: t.union([t.undefined, t.string]),
    avatar: t.union([t.undefined, t.string]),
    accessToken: t.union([t.undefined, t.string]),
    url: t.union([t.undefined, t.string]),
    registeredOn: t.union([t.undefined, DateFromISOString]),
    // count: t.union([t.number, t.undefined]),
  },
  'ContentCreator'
);

export type ContentCreator = t.TypeOf<typeof ContentCreator>;

export const AuthorizedContentCreator = t.strict(
  {
    ...ContentCreator.type.props,
    accessToken: t.string,
  },
  'AuthorizedContentCreator'
);

export type AuthorizedContentCreator = t.TypeOf<
  typeof AuthorizedContentCreator
>;

export const ContentCreatorVideosOutput = t.array(
  Video,
  'ContentCreatorVideos'
);
export type ContentCreatorVideosOutput = t.TypeOf<
  typeof ContentCreatorVideosOutput
>;
