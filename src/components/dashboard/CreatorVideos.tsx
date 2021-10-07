import { Grid, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import * as Q from 'avenger/lib/Query';
import { pipe } from 'fp-ts/lib/function';
import { Video } from '@backend/models/Video';
import React from 'react';
import { creatorVideos } from '../../API/queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { VideoCard } from '../common/VideoCard';
import { useTranslation } from 'react-i18next';

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
        if (videos.length === 0) {
          return <Typography>{t('videos:no_results')}</Typography>;
        }

        return (
          <Grid container>
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
          </Grid>
        );
      })
    );
  }
);
