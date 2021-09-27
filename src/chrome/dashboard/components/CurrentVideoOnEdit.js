import { Box } from '@material-ui/core';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { accountSettings } from '../API/queries';
import { VideoCard } from './VideoCard';
import { VideoRecommendations } from './VideoRecommendations';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from './common/FullSizeLoader';
import { ErrorBox } from './common/ErrorBox';

const VideoCardWithQuery = declareQueries({ video: accountSettings })(
  (props) => {
    return pipe(
      props.queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ video }) => {
        if (!video) {
          return 'No video selected';
        }
        return <VideoCard videoId={video.edit.currentVideoId} title={video.edit.title} />;
      })
    );
  }
);

export const CurrentVideoOnEdit = () => {
  return (
    <Box>
      <VideoCardWithQuery queries={{ video: undefined }} />
      <VideoRecommendations />
    </Box>
  );
};
