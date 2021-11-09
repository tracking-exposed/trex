import { Grid } from '@material-ui/core';
import { YTVideo } from 'components/common/YTVideo';
import * as React from 'react';
import AddRecommendationBox from '../AddRecommendationBox';
import { Recommendations } from '../Recommendations';
import { VideoRecommendations } from '../VideoRecommendationsEdit';

interface LabVideoEditProps {
  videoId: string;
}

export const LabVideoEdit: React.FC<LabVideoEditProps> = ({
  videoId,
}) => {

  return (
    <Grid container spacing={3}>
      <Grid item md={6} sm={5}>
        <YTVideo videoId={videoId} />
        <AddRecommendationBox />
        <Recommendations
          queries={{ videoRecommendations: { videoId } }}
          videoId={videoId}
        />
      </Grid>
      <Grid item md={4}>
        <VideoRecommendations
          queries={{ videoRecommendations: { videoId } }}
          videoId={videoId}
        />
      </Grid>
    </Grid>
  );
};
