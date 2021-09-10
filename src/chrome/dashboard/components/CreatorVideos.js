import { Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { creatorVideos } from '../API/queries';
import { ErrorBox } from './common/ErrorBox';
import { LazyFullSizeLoader } from './common/FullSizeLoader';
import { VideoCard } from './VideoCard';

export const CreatorVideos = declareQueries({ videos: creatorVideos })(
  ({ queries, onVideoClick }) => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
        if (!videos.length) {
          return <Typography>No videos found.</Typography>;
        }

        return videos.map((v, i) => (
          <VideoCard
            key={i}
            videoId={v.videoId}
            title={v.title}
            onClick={
              onVideoClick
                ? () => {
                    onVideoClick(v);
                  }
                : undefined
            }
          />
        ));
      })
    );
  }
);
