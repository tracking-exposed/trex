import { Box } from '@material-ui/core';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { accountSettings } from '../../API/queries';
import { VideoCard } from './VideoCard';
import { VideoRecommendations } from './VideoRecommendations';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { ErrorBox } from '../common/ErrorBox';
import { useTranslation } from 'react-i18next';

const withQueries = declareQueries({ accountSettings });

const VideoCardWithQuery = withQueries((props) => {
  const { t} = useTranslation();
  return pipe(
    props.queries,
    QR.fold(
      LazyFullSizeLoader,
      ErrorBox,
      ({ accountSettings: { edit: video } }) => {
        if (video === null) {
          return <div>{t('videos:no_selected')}</div>;
        }
        return <VideoCard videoId={video.videoId} title={video.title} />;
      }
    )
  );
});

export const CurrentVideoOnEdit: React.FC = () => {
  return (
    <Box>
      <VideoCardWithQuery />
      <VideoRecommendations />
    </Box>
  );
};
