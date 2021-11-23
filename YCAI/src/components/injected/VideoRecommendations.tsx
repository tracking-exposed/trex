import { Grid } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { videoRecommendations } from '../../state/public.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { InjectedRecommendationCard } from './InjectedRecommendationCard';

const withQueries = declareQueries({ videoRecommendations });

export const VideoRecommendations = withQueries(
  ({ queries }): React.ReactElement => pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ videoRecommendations }) => {
      return (
        <Grid container spacing={1}>
          {videoRecommendations.map((video) => (
            <Grid item xs={12} key={video.urlId}>
              <InjectedRecommendationCard {...video} />
            </Grid>
          ))}
        </Grid>
      );
    })
  )
);
