import { Box } from '@material-ui/core';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import * as React from 'react';
import { accountSettings } from '../../API/queries';
import { VideoCard } from './VideoCard';
import { VideoRecommendations } from './ContentCreatorVideoRecommendations';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { ErrorBox } from '../common/ErrorBox';
import { useTranslation } from 'react-i18next';

const withQueries = declareQueries({ accountSettings });

export const CurrentVideoOnEdit = withQueries((props): React.ReactElement => {
  const { t } = useTranslation();
  return pipe(
    props.queries,
    QR.fold(
      LazyFullSizeLoader,
      ErrorBox,
      ({ accountSettings: { edit: video } }) => {
        if (video === null) {
          return <div>{t('videos:no_selected')}</div>;
        }
        return (
          <Box>
            <VideoCard videoId={video.videoId} title={video.title} />
            <VideoRecommendations
              queries={{ videoRecommendations: { videoId: video.videoId } }}
            />
          </Box>
        );
      }
    )
  );
});
