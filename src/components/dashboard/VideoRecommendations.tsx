import { Box, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import * as queries from '../../API/queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { VideoCard } from '../common/VideoCard';

const withQueries = declareQueries({
  videoRecommendations: queries.videoRecommendations,
});

type Q = typeof withQueries['Props']

interface VideoRecommendationsProps extends Q {
  videoId: string 
}

export const VideoRecommendations = withQueries<VideoRecommendationsProps>((props): React.ReactElement => {
  return pipe(
    props.queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ videoRecommendations }) => {
      const { t } = useTranslation();

      return (
        <Box>
          <Typography variant="h5">{t('recommendations:title')}</Typography>
          {videoRecommendations.map((r, i) => (
            <VideoCard key={i} {...r} videoId={props.videoId} />
          ))}
        </Box>
      );
    })
  );
});
