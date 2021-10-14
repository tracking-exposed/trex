import { Box, Typography } from '@material-ui/core';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import * as React from 'react';
import { settings } from '../../state/public.queries';
import { VideoCard } from '../common/VideoCard';
import { VideoRecommendations } from './VideoRecommendations';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { ErrorBox } from '../common/ErrorBox';
import { useTranslation } from 'react-i18next';

const withQueries = declareQueries({ accountSettings: settings });

export const CurrentVideoOnEdit = withQueries((props): React.ReactElement => {
  const { t } = useTranslation();
  return pipe(
    props.queries,
    QR.fold(
      LazyFullSizeLoader,
      ErrorBox,
      ({ accountSettings: { edit: video } }) => {
        if (video === null) {
          return (
            <Box>
              <Typography>{t('videos:no_selected')}</Typography>
            </Box>
          );
        }
        return (
          <Box>
            <VideoCard videoId={video.videoId} title={video.title} />
            <VideoRecommendations videoId={video.videoId} />
          </Box>
        );
      }
    )
  );
});
