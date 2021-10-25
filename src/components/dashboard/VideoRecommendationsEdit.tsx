import { Box, Grid, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { updateRecommendationForVideo } from '../../state/creator.commands';
import * as queries from '../../state/public.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { RecommendationCard } from '../common/RecommendationCard';
import { ReorderList } from '../common/ReorderList';

const withQueries = declareQueries({

  settings: queries.settings,
  videoRecommendations: queries.videoRecommendations,
});

type Queries = typeof withQueries['Props'];

interface VideoRecommendationsProps extends Queries {
  videoId: string;
}

export const VideoRecommendations = withQueries<VideoRecommendationsProps>(
  ({ queries, videoId }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(
        LazyFullSizeLoader,
        ErrorBox,
        ({ settings, videoRecommendations }) => {
          const { t } = useTranslation();

          return (
            <Box>
              <Typography variant="h5">{t('recommendations:title')}</Typography>
              <Grid container>
                <ReorderList
                  getKey={(item) => item.urlId}
                  items={videoRecommendations.map((v, i) => ({
                    ...v,
                    index: i,
                  }))}
                  compareItem={(item, dragItem) => {
                    return item.urlId !== dragItem.urlId;
                  }}
                  onDragComplete={(recommendations) => {
                    void updateRecommendationForVideo(
                      {
                        videoId,
                        creatorId: settings.channelCreatorId,
                        recommendations: recommendations.map((r) => r.urlId),
                      },
                      {
                        videoRecommendations: {
                          videoId,
                        },
                      }
                    )();
                  }}
                  renderItem={(item, i) => (
                    <RecommendationCard
                      key={i}
                      data={item}
                      alreadyPresent={true}
                      onDeleteClick={(r) => {
                        void updateRecommendationForVideo(
                          {
                            videoId,
                            creatorId: settings.channelCreatorId,
                            recommendations: videoRecommendations
                              .map((d) => d.urlId)
                              .filter((dd) => dd !== r.urlId),
                          },
                          {
                            videoRecommendations: {
                              videoId,
                            },
                          }
                        )();
                      }}
                    />
                  )}
                />
              </Grid>
            </Box>
          );
        }
      )
    );
  }
);
