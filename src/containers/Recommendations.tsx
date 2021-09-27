import { creatorRecommendations } from '@chrome/dashboard/API/queries';
import { ErrorBox } from '@chrome/dashboard/components/common/ErrorBox';
import { LazyFullSizeLoader } from '@chrome/dashboard/components/common/FullSizeLoader';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import * as React from 'react';

const withQueries = declareQueries({ recommendations: creatorRecommendations });

export const Recommendations = withQueries(
  ({ queries }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ recommendations }) => {
        return <div>Total recommendations {recommendations.length}</div>;
      })
    );
  }
);
