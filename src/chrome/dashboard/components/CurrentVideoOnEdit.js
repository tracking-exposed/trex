import { Box } from '@material-ui/core';
import React from 'react';
import { VideoCard } from './VideoCard';
import { VideoRecommendations } from './VideoRecommendations';

export const CurrentVideoOnEdit = ({ video }) => {
  if (!video) {
    return 'No video selected';
  }

  return (
    <Box>
      <VideoCard id={video.videoId} title={video.title} />
      <VideoRecommendations />
    </Box>
  );
};
