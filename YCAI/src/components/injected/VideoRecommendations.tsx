import { Grid } from '@material-ui/core';
import React from 'react';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { InjectedRecommendationCard } from './InjectedRecommendationCard';
import { Recommendation } from '@shared/models/Recommendation';

interface VideoRecommendationsProps {
  recommendations: Recommendation[];
  loading: boolean;
};

export const VideoRecommendations: React.FC<VideoRecommendationsProps> = ({
  recommendations,
  loading,
}) => (loading ? <LazyFullSizeLoader /> : (
  <Grid container spacing={1}>
    {recommendations.map((video) => (
      <Grid item xs={12} key={video.urlId}>
        <InjectedRecommendationCard {...video} />
      </Grid>
    ))}
  </Grid>
));
