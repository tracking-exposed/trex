import { Box, Typography } from '@material-ui/core';
import { ErrorBox } from '@shared/components/Error/ErrorBox';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  patchRecommendation,
  updateRecommendationsForVideo,
} from '../../../../state/dashboard/creator.commands';
import * as publicQueries from '../../../../state/dashboard/public.queries';
import { LazyFullSizeLoader } from '../../../common/FullSizeLoader';
import { ReorderList } from '../../../common/ReorderList';
import RecommendationCard from './RecommendationCard';

const withQueries = declareQueries({
  settings: publicQueries.settings,
  videoRecommendations: publicQueries.videoRecommendations,
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

          const recElement =
            videoRecommendations.length > 0 ? (
              <ReorderList
                spacing={2}
                getKey={(item) => item.urlId}
                items={videoRecommendations.map((v, i) => ({
                  ...v,
                  index: i,
                }))}
                compareItem={(item, dragItem) => {
                  return item.urlId !== dragItem.urlId;
                }}
                onDragComplete={(recommendations) => {
                  void updateRecommendationsForVideo(
                    {
                      videoId,
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
                    edit={{ videoId }}
                    key={item.urlId}
                    data={item}
                    onEditCompleted={(r) => {
                      void patchRecommendation({
                        urlId: item.urlId,
                        data: {
                          title: r.title,
                          description: r.description,
                        },
                      })().then(() =>
                        publicQueries.videoRecommendations.invalidate({
                          videoId,
                        })()
                      );
                    }}
                    onDeleteClick={() => {
                      void updateRecommendationsForVideo(
                        {
                          videoId,
                          recommendations: videoRecommendations
                            .map((d) => d.urlId)
                            .filter((dd) => dd !== item.urlId),
                        },
                        {
                          videoRecommendations: {
                            videoId,
                          },
                        }
                      )();
                    }}
                    onMoveUpClick={
                      i > 0 &&
                      (() => {
                        const pos = videoRecommendations.findIndex(
                          ({ urlId }) => urlId === item.urlId
                        );
                        const urlIds = videoRecommendations.map(
                          ({ urlId }) => urlId
                        );
                        const tmp = urlIds[pos - 1];
                        urlIds[pos - 1] = urlIds[pos];
                        urlIds[pos] = tmp;
                        void updateRecommendationsForVideo(
                          {
                            videoId,
                            recommendations: urlIds,
                          },
                          {
                            videoRecommendations: {
                              videoId,
                            },
                          }
                        )();
                      })
                    }
                    onMoveDownClick={
                      i < videoRecommendations.length - 1 &&
                      (() => {
                        const pos = videoRecommendations.findIndex(
                          ({ urlId }) => urlId === item.urlId
                        );
                        const urlIds = videoRecommendations.map(
                          ({ urlId }) => urlId
                        );
                        const tmp = urlIds[pos + 1];
                        urlIds[pos + 1] = urlIds[pos];
                        urlIds[pos] = tmp;
                        void updateRecommendationsForVideo(
                          {
                            videoId,
                            recommendations: urlIds,
                          },
                          {
                            videoRecommendations: {
                              videoId,
                            },
                          }
                        )();
                      })
                    }
                  />
                )}
              />
            ) : (
              <div>
                <Typography>{t('recommendations:no_items')}</Typography>
              </div>
            );

          return <Box>{recElement}</Box>;
        }
      )
    );
  }
);
