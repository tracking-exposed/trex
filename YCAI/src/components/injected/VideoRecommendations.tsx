import { Grid, Typography, Link } from '@material-ui/core';
import React from 'react';
import { Trans } from 'react-i18next';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { InjectedRecommendationCard } from './InjectedRecommendationCard';
import { Recommendation } from '@shared/models/Recommendation';
import { config } from '../../config';

interface VideoRecommendationsProps {
  recommendations: Recommendation[];
  loading: boolean;
};

export const VideoRecommendations: React.FC<VideoRecommendationsProps> = ({
  recommendations,
  loading,
}) => (loading ? <LazyFullSizeLoader /> : (recommendations.length === 0 ? (
  <Typography style={{ fontSize: '1.4rem' }}>
    <Trans i18nKey="ytVideoPage:noCCRecommendations">
      This creator has not uploaded customized recommendations yet. If you own this channel, you can do it
      <Link href={config.PUBLIC_URL}>here</Link>.
    </Trans>
  </Typography>
): (
  <Grid container spacing={1}>
    {recommendations.map((video) => (
      <Grid item xs={12} key={video.urlId}>
        <InjectedRecommendationCard {...video} />
      </Grid>
    ))}
  </Grid>
)));
