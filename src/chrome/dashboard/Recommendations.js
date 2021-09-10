import { Card } from '@material-ui/core';
import { ContactsOutlined } from '@material-ui/icons';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { updateRecommendationForVideo } from './API/commands';
import { currentVideoOnEdit, recommendations } from './API/queries';
import { ErrorBox } from './components/common/ErrorBox';
import { LazyFullSizeLoader } from './components/common/FullSizeLoader';
import UrlCard from './UrlCard';

const styles = {
  textAlign: 'left',
};

const RecommendationCards = declareQueries({
  recommendations,
  currentVideoOnEdit,
})(({ queries }) => {
  console.log(queries);
  return (
    <div>
      <div style={styles}>
        <h4>Your recommendations</h4>
      </div>
      {pipe(
        queries,
        QR.fold(
          LazyFullSizeLoader,
          ErrorBox,
          ({ recommendations, currentVideoOnEdit: video }) => {
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
                  const videoReccomendations = video
                    ? video.recommendations
                    : [];
                  const alreadyPresent = videoReccomendations.includes(
                    item.urlId
                  );

                  console.log({ videoReccomendations, alreadyPresent });
                  return (
                    <UrlCard
                      key={i}
                      data={item}
                      alreadyPresent={alreadyPresent}
                      onDeleteClick={
                        video
                          ? () => {
                              const newVideoRecommendations =
                                videoReccomendations.filter(
                                  (v) => v !== item.urlId
                                );

                              updateRecommendationForVideo(
                                {
                                  videoId: video.videoId,
                                  creatorId: video.creatorId,
                                  recommendations: newVideoRecommendations,
                                },
                                {
                                  currentVideoOnEdit: undefined,
                                  recommendations: {},
                                }
                              )();
                            }
                          : undefined
                      }
                      onAddClick={
                        video
                          ? () => {
                              const newVideoRecommendations =
                                video.recommendations
                                  .filter((v) => v !== item.urlId)
                                  .concat(item.urlId);

                              updateRecommendationForVideo(
                                {
                                  videoId: video.videoId,
                                  creatorId: video.creatorId,
                                  recommendations: newVideoRecommendations,
                                },
                                {
                                  currentVideoOnEdit: undefined,
                                  recommendations: {},
                                }
                              )();
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
    </div>
  );
});

const Recommendations = () => {
  return (
    <RecommendationCards
      queries={{
        recommendations: {},
        video: {},
      }}
    />
  );
};

export default Recommendations;
