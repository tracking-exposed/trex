import * as React from 'react';
import { doUpdateCurrentView } from '../../../utils/location.utils';
import { CreatorVideos } from '../CreatorVideos';

export const Lab: React.FC = () => {
  return (
    <CreatorVideos
      openVideoRecommendations={async (v) => {
        await doUpdateCurrentView({
          view: 'labEdit',
          videoId: v.videoId,
        })();
      }}
    />
  );
};
