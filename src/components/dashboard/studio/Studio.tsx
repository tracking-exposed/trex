import * as React from 'react';
import { CurrentView, doUpdateCurrentView } from 'utils/location.utils';
import { CreatorVideos } from '../CreatorVideos';
import { StudioVideoEdit } from './StudioVideoEdit';

interface StudioProps {
  currentView: CurrentView;
}

export const Studio: React.FC<StudioProps> = ({ currentView }) => {
  switch (currentView.view) {
    case 'studioEdit':
      return <StudioVideoEdit videoId={currentView.videoId} />;
    default:
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
  }
};
