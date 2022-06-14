import { StringOrNull } from './common/StringOrNull';
import { AuthResponse } from './Auth';
import {
  AuthorizedContentCreator,
  ContentCreator,
  ContentCreatorVideosOutput,
  RegisterContentCreatorBody,
} from './ContentCreator';
import { ChannelADV, ChannelADVStats } from './stats/ChannelADV';
import { CreatorStats, CreatorStatContent } from './CreatorStats';
import { HandshakeBody, HandshakeResponse } from './HandshakeBody';
import {
  Recommendation,
  PartialRecommendation,
  CreateRecommendation,
  RecommendationList,
} from './Recommendation';
import { GetRelatedChannelsOutput, ChannelRelated } from './ChannelRelated';
import { Video, UpdateVideoBody } from './Video';
import {
  AddEventsBody,
  ContributionEvent,
  VideoContributionEvent,
} from './ContributionEvent';
import {
  GuardoniExperiment,
  ConcludeGuardoniExperimentOutput,
  GetDirectiveOutput,
  GetPublicDirectivesOutput,
  GetExperimentListOutput,
} from './Experiment';
import * as Directive from './Directive';
import { Supporter } from './Supporter';

export default {
  // common
  StringOrNull,
  // handshake
  HandshakeBody,
  HandshakeResponse,
  ContributionEvent,
  VideoContributionEvent,
  AddEventsBody,
  // supporter
  Supporter,
  // guardoni
  // guardoni experiments (to be moved)
  GuardoniExperiment,
  ConcludeGuardoniExperimentOutput,
  GetDirectiveOutput,
  GetExperimentListOutput,
  GetPublicDirectivesOutput,
  // ycai
  // content creator
  RegisterContentCreatorBody,
  AuthResponse,
  AuthorizedContentCreator,
  ContentCreator,
  // cc recommendations
  CreateRecommendation,
  Recommendation,
  PartialRecommendation,
  RecommendationList,
  // cc videos
  Video,
  UpdateVideoBody,
  ContentCreatorVideosOutput,
  // cc stats
  ChannelADV,
  ChannelADVStats,
  CreatorStats,
  CreatorStatContent,
  ChannelRelated,
  GetRelatedChannelsOutput,
  ...Directive
};
