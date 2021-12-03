import { Grid } from '@material-ui/core';
import { YTVideo } from '../../common/YTVideo';
import * as React from 'react';
import AddRecommendationBox from './AddRecommendationBox';
import { VideoRecommendations } from './VideoRecommendations';

interface LabVideoEditProps {
  videoId: string;
}

export const LabVideoEdit: React.FC<LabVideoEditProps> = ({
  videoId,
}) => {

  return (
    <Grid container spacing={4} alignItems="flex-start">
      <Grid container item lg={7} md={6} xs={12} spacing={4}>
        <Grid item xs={12}>
          <YTVideo videoId={videoId} />
        </Grid>
        <Grid item xs={12}>
          <AddRecommendationBox videoId={videoId} />
        </Grid>
      </Grid>
      <Grid item lg={5} md={6} xs={12}>
        <VideoRecommendations
          queries={{ videoRecommendations: { videoId } }}
          videoId={videoId}
        />
      </Grid>
    </Grid>
  );
};
