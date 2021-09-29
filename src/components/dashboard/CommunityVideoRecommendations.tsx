import { Box, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import * as queries from '../../API/queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { VideoCard } from './VideoCard';

const withQueries = declareQueries({
  videoRecommendations: queries.videoRecommendations,
});

export const VideoRecommendations = withQueries((props): React.ReactElement => {
  return pipe(
    props.queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ videoRecommendations }) => {
      const { t } = useTranslation();

      return (
        <Box>
          <Typography variant="h5">{t('recommendations:title')}</Typography>
          {videoRecommendations.map((r, i) => (
            <VideoCard key={i} {...r} />
          ))}
        </Box>
      );
    })
  );
});
