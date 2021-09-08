import { Card } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import React from 'react';
import { updateRecommendationForVideo } from './API/commands';
import * as queries from './API/queries';
import { ErrorBox } from './components/common/ErrorBox';
import { LazyFullSizeLoader } from './components/common/FullSizeLoader';
import UrlCard from './UrlCard';

const styles = {
  /* width: '400px', */
  textAlign: 'left'
};

class Recommendations extends React.PureComponent {
  render () {
    return (
      <WithQueries
        queries={{
          recommendations: queries.recommendations,
          currentVideo: queries.currentVideoOnEdit,
          videoRecommendations: queries.videoRecommendations
        }}
        params={{ recommendations: { paging: true } }}
        render={QR.fold(
          LazyFullSizeLoader,
          ErrorBox,
          ({ currentVideo, recommendations, videoRecommendations }) => {
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
              <div>
                <div style={styles}>
                  <h4>Your recommendations</h4>
                </div>
                <div className="card-group">
                  {recommendations.map((item, i) => (
                    <UrlCard
                      key={i}
                      data={item}
                      onAddClick={() => {
                        console.log({ videoRecommendations });
                        const newVideoRecommendations = videoRecommendations
                          .map((v) => v.urlId)
                          .filter((v) => v !== item.urlId)
                          .concat(item.urlId);
                        console.log({ newVideoRecommendations });
                        updateRecommendationForVideo({
                          videoId: currentVideo.videoId,
                          recommendations: newVideoRecommendations
                        })();
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          }
        )}
      />
    );
  }
}

export default Recommendations;
