import { Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import * as Q from 'avenger/lib/Query';
import { pipe } from 'fp-ts/lib/function';
import { Video } from 'models/Video';
import React from 'react';
import { creatorVideos } from '../API/queries';
import { ErrorBox } from './common/ErrorBox';
import { LazyFullSizeLoader } from './common/FullSizeLoader';
import { VideoCard } from './VideoCard';

const withQueries = declareQueries({ videos: creatorVideos });

type Q = typeof withQueries['Props'];

interface CreatorVideosProps extends Q {
  onVideoClick?: (v: Video) => void;
}

export const CreatorVideos = withQueries<CreatorVideosProps>(
  ({ queries, onVideoClick }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
        if (videos.length === 0) {
          return <Typography>No videos found.</Typography>;
        }

        return (
          <div>
            {videos.map((v, i) => (
              <VideoCard
                key={i}
                videoId={v.videoId}
                title={v.title}
                onClick={
                  onVideoClick !== undefined
                    ? () => {
                        onVideoClick(v);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        );
      })
    );
  }
);
