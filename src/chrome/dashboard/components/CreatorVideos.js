import { declareQueries, WithQueries } from 'avenger/lib/react';
import React from 'react';
import { creatorVideos } from '../API/queries';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from './common/FullSizeLoader';
import { ErrorBox } from './common/ErrorBox';
import { VideoCard } from './VideoCard';
import { setCurrentVideo } from '../API/commands';
import { pipe } from 'fp-ts/lib/function';

export const CreatorVideos = declareQueries({ videos: creatorVideos })(
  ({ queries, onVideoClick }) => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
        console.log(videos);
        return videos.map((v, i) => (
          <VideoCard
            key={i}
            videoId={v.videoId}
            title={v.title}
            onClick={() => {
              onVideoClick(v);
            }}
          />
        ));
      })
    );
  }
);
