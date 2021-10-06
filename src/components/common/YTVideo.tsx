import * as React from 'react';

interface YTVideoProps {
  videoId: string;
}

export const YTVideo: React.FC<YTVideoProps> = ({ videoId }) => {
  return (
    <iframe
      style={{
        maxWidth: 600,
        maxHeight: 400,
        minHeight: 300,
        width: '100%',
        height: 'auto',
      }}
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};
