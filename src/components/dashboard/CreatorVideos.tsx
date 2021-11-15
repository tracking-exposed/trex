import { Video } from '@backend/models/Video';
import { Button, Box, Grid, Typography } from '@material-ui/core';
import * as Q from 'avenger/lib/Query';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { pullContentCreatorVideos } from 'state/creator.commands';
import { creatorVideos } from '../../state/creator.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { VideoCard } from './lab/VideoCard';

const withQueries = declareQueries({ videos: creatorVideos });

type Q = typeof withQueries['Props'];

interface CreatorVideosProps extends Q {
  openVideoRecommendations: (v: Video) => void;
}

export const CreatorVideos = withQueries<CreatorVideosProps>(
  ({ queries, openVideoRecommendations }): React.ReactElement => {
    const { t } = useTranslation();
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
        return (
          <Grid container spacing={2} style={{ width: '100%' }}>
            {videos.length === 0 ? (
              <Grid item lg={12} md={12}>
                <Typography>{t('videos:no_results')}</Typography>
                <Button onClick={() => pullContentCreatorVideos({})()}>
                  {t('actions:pull_creator_videos')}
                </Button>
              </Grid>
            ) : (
              videos.map((v) => (
                <Grid item lg={3} md={4} sm={6} xs={12} key={v.urlId}>
                  <VideoCard
                    videoId={v.videoId}
                    title={v.title}
                    openRecommendations={() => openVideoRecommendations(v)}
                  />
                </Grid>
              ))
            )}
            <Grid item xs={12}>
              <Box mt={2}>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => pullContentCreatorVideos({})()}
                >
                  {t('actions:update_creator_videos_list')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        );
      })
    );
  }
);
