import { AuthResponse } from './Auth';
import {
  AuthorizedContentCreator,
  ContentCreator,
  ContentCreatorVideosOutput,
  RegisterContentCreatorBody,
} from './ContentCreator';
import { ChannelADV } from './stats/ChannelADV';
import { CreatorStats, CreatorStatContent } from './CreatorStats';
import { HandshakeBody } from './HandshakeBody';
import {
  Recommendation,
  PartialRecommendation,
  CreateRecommendation,
  RecommendationList,
} from './Recommendation';
import { GetRelatedChannelsOutput, ChannelRelated } from './ChannelRelated';
import { Video, UpdateVideoBody } from './Video';
import { VideoContributionEvent } from './ContributionEvent';
import {
  GuardoniExperiment,
  ConcludeGuardoniExperimentOutput,
  GetDirectiveOutput,
  GetPublicDirectivesOutput,
  GetExperimentListOutput,
} from './Experiment';
import { PostDirectiveResponse } from './Directive';

export default {
  // common
  HandshakeBody,
  VideoContributionEvent,
  // guardoni
  // guardoni experiments (to be moved)
  PostDirectiveResponse,
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
  CreatorStats,
  CreatorStatContent,
  ChannelRelated,
  GetRelatedChannelsOutput,
};
