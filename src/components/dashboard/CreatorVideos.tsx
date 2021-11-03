import { Video } from '@backend/models/Video';
import { Button, Grid, Typography } from '@material-ui/core';
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
import { VideoCard } from '../common/VideoCard';

const withQueries = declareQueries({ videos: creatorVideos });

type Q = typeof withQueries['Props'];

interface CreatorVideosProps extends Q {
  onVideoClick?: (v: Video) => void;
}

export const CreatorVideos = withQueries<CreatorVideosProps>(
  ({ queries, onVideoClick }): React.ReactElement => {
    const { t } = useTranslation();
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
        return (
          <Grid container>
            {videos.length === 0 ? (
              <Grid>
                <Typography>{t('videos:no_results')}</Typography>
                <Button onClick={() => pullContentCreatorVideos({})()}>
                  {t('actions:pull_creator_videos')}
                </Button>
              </Grid>
            ) : (<>
              {videos.map((v, i) => (
                <Grid item md={3} key={v.videoId}>
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
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button onClick={() => pullContentCreatorVideos({})()}>
                  {t('actions:update_creator_videos_list')}
                </Button>
              </Grid>
            </>)}
          </Grid>
        );
      })
    );
  }
);
