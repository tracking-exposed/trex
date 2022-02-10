import React, { useEffect } from 'react';
import { Video } from '@trex/shared/models/Video';
import { Grid, Typography } from '@material-ui/core';
import * as Q from 'avenger/lib/Query';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import { useTranslation } from 'react-i18next';
import { pullContentCreatorVideos } from '../../../state/dashboard/creator.commands';
import { creatorVideos } from '../../../state/dashboard/creator.queries';
import { ErrorBox } from '@trex/shared/components/Error/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { VideoCard } from './VideoCard';

const withQueries = declareQueries({ videos: creatorVideos });

type Q = typeof withQueries['Props'];

interface CreatorVideosProps extends Q {
  openVideoRecommendations: (v: Video) => void;
}

export const CreatorVideos = withQueries<CreatorVideosProps>(
  ({ queries, openVideoRecommendations }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
        const { t } = useTranslation();

        useEffect(() => {
          void pullContentCreatorVideos({})();
        }, []);

        return (
          <Grid container spacing={2}>
            {videos.length === 0 ? (
              <Grid item xs={12}>
                <Typography>{t('videos:no_results')}</Typography>
              </Grid>
            ) : (
              videos.map((v) => (
                <Grid item lg={2} md={3} sm={6} xs={12} key={v.videoId}>
                  <VideoCard
                    videoId={v.videoId}
                    title={v.title}
                    openRecommendations={() => openVideoRecommendations(v)}
                  />
                </Grid>
              ))
            )}
          </Grid>
        );
      })
    );
  }
);
