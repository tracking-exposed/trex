import { Box, Card, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { updateRecommendationForVideo } from '../../API/commands';
import { accountSettings, creatorRecommendations } from '../../API/queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { URLCard } from './URLCard';

const styles = {
  textAlign: 'left' as 'left',
};

const withQueries = declareQueries({
  recommendations: creatorRecommendations,
  settings: accountSettings,
});

export const Recommendations = withQueries(
  ({ queries }): React.ReactElement => {
    const { t } = useTranslation();
    return (
      <Box>
        <Typography variant="h4">{t('recommendations:yours')}</Typography>

        {pipe(
          queries,
          QR.fold(
            LazyFullSizeLoader,
            ErrorBox,
            ({ recommendations, settings }) => {
              if (recommendations.length === 0) {
                return (
                  <div style={styles}>
                    <Card>
                      <h3>
                        Altought connection with server worked, no content was
                        available!?
                      </h3>
                    </Card>
                  </div>
                );
              }
              return (
                <div className="card-group">
                  {recommendations.map((item, i) => {
                    const currentVideoOnEdit = settings.edit;
                    const videoRaccomendations =
                      currentVideoOnEdit !== null
                        ? currentVideoOnEdit.recommendations
                        : [];
                    const alreadyPresent = videoRaccomendations.includes(
                      item.urlId
                    );

                    return (
                      <URLCard
                        key={i}
                        data={item}
                        alreadyPresent={alreadyPresent}
                        onDeleteClick={
                          currentVideoOnEdit !== null
                            ? async () => {
                                const newVideoRecommendations =
                                  videoRaccomendations.filter(
                                    (v) => v !== item.urlId
                                  );

                                await updateRecommendationForVideo({
                                  videoId: currentVideoOnEdit.videoId,
                                  creatorId: settings.channelCreatorId,
                                  recommendations: newVideoRecommendations,
                                })();
                              }
                            : undefined
                        }
                        onAddClick={
                          currentVideoOnEdit !== null
                            ? async () => {
                                const newVideoRecommendations =
                                  currentVideoOnEdit.recommendations
                                    .filter((v) => v !== item.urlId)
                                    .concat(item.urlId);

                                await updateRecommendationForVideo({
                                  videoId: currentVideoOnEdit.videoId,
                                  creatorId: settings.channelCreatorId,
                                  recommendations: newVideoRecommendations,
                                })();
                              }
                            : undefined
                        }
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
