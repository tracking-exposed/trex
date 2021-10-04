import { Box, Card, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { updateRecommendationForVideo } from '../../API/commands';
import {
  accountSettings,
  creatorRecommendations,
  videoRecommendations,
} from '../../API/queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { RecommendationCard } from './RecommendationCard';

const styles = {
  textAlign: 'left' as 'left',
};

const withQueries = declareQueries({
  recommendations: creatorRecommendations,
  videoRecommendations: videoRecommendations,
  settings: accountSettings,
});

type Queries = typeof withQueries['Props'];

interface RecommendationsProps extends Queries {
  videoId: string;
}

export const Recommendations = withQueries<RecommendationsProps>(
  ({ queries, videoId }): React.ReactElement => {
    const { t } = useTranslation();
    return (
      <Box>
        <Typography variant="h4">{t('recommendations:yours')}</Typography>

        {pipe(
          queries,
          QR.fold(
            LazyFullSizeLoader,
            ErrorBox,
            ({ recommendations, videoRecommendations, settings }) => {
              if (recommendations.length === 0) {
                return (
                  <div style={styles}>
                    <Card>
                      <Typography variant="h3">
                        Altought connection with server worked, no content was
                        available!?
                      </Typography>
                    </Card>
                  </div>
                );
              }

              const videoCurrentRecommendations = videoRecommendations.map(
                (v) => v.urlId
              );

              return (
                <div className="card-group">
                  {recommendations
                    // remove already selected recommendations from list
                    .filter(
                      (r) => !videoCurrentRecommendations.includes(r.urlId)
                    )
                    .map((item, i) => {
                      const alreadyPresent =
                        videoCurrentRecommendations.includes(item.urlId);

                      return (
                        <RecommendationCard
                          key={i}
                          data={item}
                          alreadyPresent={alreadyPresent}
                          onDeleteClick={async () => {
                            const newVideoRecommendations =
                              videoCurrentRecommendations.filter(
                                (v) => v !== item.urlId
                              );

                            await updateRecommendationForVideo(
                              {
                                videoId: videoId,
                                creatorId: settings.channelCreatorId,
                                recommendations: newVideoRecommendations,
                              },
                              { videoRecommendations: { videoId } }
                            )();
                          }}
                          onAddClick={async () => {
                            const newVideoRecommendations =
                              videoCurrentRecommendations
                                .filter((v) => v !== item.urlId)
                                .concat(item.urlId);
                            await updateRecommendationForVideo(
                              {
                                videoId,
                                creatorId: settings.channelCreatorId,
                                recommendations: newVideoRecommendations,
                              },
                              { videoRecommendations: { videoId } }
                            )();
                          }}
                        />
                      );
                    })}
                </div>
              );
            }
          )
        )}
      </Box>
    );
  }
);
