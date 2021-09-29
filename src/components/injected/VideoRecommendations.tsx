import { videoRecommendations } from 'API/queries';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import * as React from 'react';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';

const withQueries = declareQueries({ videoRecommendations });

export const Recommendations = withQueries(
  ({ queries }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videoRecommendations }) => {
        return <div>Total recommendations {videoRecommendations.length}</div>;
      })
    );
  }
);
