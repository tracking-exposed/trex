import * as React from 'react';
import { doUpdateCurrentView } from '../../../utils/location.utils';
import { CreatorVideos } from '../CreatorVideos';

export const Studio: React.FC = () => {
  return (
    <CreatorVideos
      onVideoClick={async (v) => {
        await doUpdateCurrentView({
          view: 'studioEdit',
          videoId: v.videoId,
        })();
      }}
    />
  );
};
