import * as React from 'react';

import { getYTThumbnailById } from '../../utils/yt.utils';

interface YTVideoProps {
  videoId: string;
}

export const YTVideo: React.FC<YTVideoProps> = ({ videoId }) => {
  return (
    <img
      style={{
        maxWidth: 600,
        maxHeight: 400,
        minHeight: 300,
        width: '100%',
        height: 'auto',
      }}
      src={getYTThumbnailById(videoId)}
      title="YouTube Video Thumbnail"
    />
  );
};
