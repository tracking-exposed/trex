import React, { useEffect } from 'react';
import { Video } from '@shared/models/Video';
<<<<<<< HEAD
import { Grid, Typography } from '@material-ui/core';
=======
import { makeStyles } from '@material-ui/core/styles';
import { Button, Box, Grid, Typography } from '@material-ui/core';
import { Sync as SyncIcon } from '@material-ui/icons';
>>>>>>> 65a8dddad059e4f13946ba5d4fb7b9d8427c9c3e
import * as Q from 'avenger/lib/Query';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import { useTranslation } from 'react-i18next';
import { pullContentCreatorVideos } from '../../../state/dashboard/creator.commands';
import { creatorVideos } from '../../../state/dashboard/creator.queries';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { VideoCard } from './VideoCard';
import { YCAITheme } from '../../../theme';

const withQueries = declareQueries({ videos: creatorVideos });

type Q = typeof withQueries['Props'];

interface CreatorVideosProps extends Q {
  openVideoRecommendations: (v: Video) => void;
}

const useStyles = makeStyles<YCAITheme>((theme) => ({
  updateButton: {
    borderColor: theme.palette.common.black,
    color: theme.palette.common.black,
  },
}));

export const CreatorVideos = withQueries<CreatorVideosProps>(
  ({ queries, openVideoRecommendations }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
        const { t } = useTranslation();
<<<<<<< HEAD

        useEffect(() => {
          void pullContentCreatorVideos({})();
        }, []);

=======
        const classes = useStyles();
>>>>>>> 65a8dddad059e4f13946ba5d4fb7b9d8427c9c3e
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box mb={2}>
                <Button
                  startIcon={<SyncIcon />}
                  color="primary"
                  className={classes.updateButton}
                  variant="outlined"
                  onClick={() => pullContentCreatorVideos({})()}
                >
                  {t('actions:update_creator_videos_list')}
                </Button>
              </Box>
            </Grid>
            {videos.length === 0 ? (
              <Grid item xs={12}>
                <Typography>{t('videos:no_results')}</Typography>
              </Grid>
            ) : (
              videos.map((v) => (
                <Grid item lg={3} md={3} sm={6} xs={12} key={v.videoId}>
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
