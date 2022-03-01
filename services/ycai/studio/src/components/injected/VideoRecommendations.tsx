import { Grid, Typography } from '@material-ui/core';
import { Recommendation } from '@shared/models/Recommendation';
import React from 'react';
import { Trans } from 'react-i18next';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { InjectedRecommendationCard } from './InjectedRecommendationCard';

interface VideoRecommendationsProps {
  recommendations: Recommendation[];
  loading: boolean;
}

export const VideoRecommendations: React.FC<VideoRecommendationsProps> = ({
  recommendations,
  loading,
}) => {
  return loading ? (
    <LazyFullSizeLoader />
  ) : recommendations.length === 0 ? (
    <Typography style={{ fontSize: '1.4rem' }}>
      <Trans
        i18nKey="ytVideoPage:noCCRecommendations"
        value={{ subject: 'video' }}
      >
        No recommendations on this {{ subject: 'video' }} yet.
      </Trans>
    </Typography>
  ) : (
    <Grid container spacing={1}>
      {recommendations.map((video) => (
        <Grid item xs={12} key={video.urlId}>
          <InjectedRecommendationCard {...video} />
        </Grid>
      ))}
    </Grid>
  );
};
