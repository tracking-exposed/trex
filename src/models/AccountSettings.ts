import { Video } from '@backend/models/Video';

interface AccountKeys {
  publicKey: string;
  secretKey: string;
}

/**
 * Account Settings
 *
 */
export interface AccountSettings extends AccountKeys {
  channelCreatorId: string | null;
  active: boolean;
  ccRecommendations: boolean;
  communityRecommendations: boolean;
  stats: boolean;
  svg: boolean;
  videorep: boolean;
  playhide: boolean;
  alphabeth: boolean;
  ux: boolean;
  edit: Video | null;
}
