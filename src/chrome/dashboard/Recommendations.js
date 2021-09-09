import { Card } from '@material-ui/core';
import { ContactsOutlined } from '@material-ui/icons';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { updateRecommendationForVideo } from './API/commands';
import * as queries from './API/queries';
import { ErrorBox } from './components/common/ErrorBox';
import { LazyFullSizeLoader } from './components/common/FullSizeLoader';
import UrlCard from './UrlCard';

const styles = {
  textAlign: 'left',
};

const RecommendationCards = declareQueries({
  recommendations: queries.recommendations,
  video: queries.currentVideoOnEdit,
})(({ queries }) => {
  return (
    <div>
      {pipe(
        queries,
        QR.fold(LazyFullSizeLoader, ErrorBox, ({ recommendations, video }) => {
          if (recommendations.length === 0) {
            return (
              <div style={styles}>
                <Card>
                  <h1>
                    Altought connection with server worked, no content was
                    available:{' '}
                    <a href="https://www.youtube.com/watch?v=bs2u4NLaxbI">
                      ODD?
                    </a>
                    .
                  </h1>
                </Card>
              </div>
            );
          }
          return (
            <div className="card-group">
              {recommendations.map((item, i) => (
                <UrlCard
                  key={i}
                  data={item}
                  onAddClick={() => {
                    if (video) {
                      const newVideoRecommendations = video.recommendations
                        .filter((v) => v !== item.urlId)
                        .concat(item.urlId);

                      updateRecommendationForVideo(
                        {
                          videoId: video.videoId,
                          recommendations: newVideoRecommendations,
                        },
                        {
                          currentVideoOnEdit: undefined,
                        }
                      )();
                    }
                  }}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
});

const Recommendations = () => {
  return (
    <div>
      <div style={styles}>
        <h4>Your recommendations</h4>
      </div>
      <RecommendationCards
        queries={{
          recommendations: {},
          video: {},
        }}
      />
    </div>
  );
};

export default Recommendations;
