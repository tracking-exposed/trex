import { Grid } from '@material-ui/core';
import * as React from 'react';
import { addRecommendationForVideo } from 'state/dashboard/creator.commands';
import { YTVideo } from '../../../common/YTVideo';
import AddRecommendationBox from '../AddRecommendationBox';
import { VideoRecommendations } from './VideoRecommendations';

interface LabVideoEditProps {
  videoId: string;
}

export const LabVideoEdit: React.FC<LabVideoEditProps> = ({ videoId }) => {
  const onRecommendationAdd = React.useCallback((recommendationURL: string) => {
    void addRecommendationForVideo(
      {
        videoId,
        recommendationURL,
      },
      {
        videoRecommendations: { videoId },
      }
    )();
  }, []);

  return (
    <Grid container spacing={4} alignItems="flex-start">
      <Grid container item lg={6} md={6} xs={12} spacing={4}>
        <Grid item xs={12}>
          <YTVideo videoId={videoId} />
        </Grid>
        <Grid item xs={12}>
          <AddRecommendationBox onAddClick={onRecommendationAdd} />
        </Grid>
      </Grid>
      <Grid item lg={5} md={5} xs={12}>
        <VideoRecommendations
          queries={{ videoRecommendations: { videoId } }}
          videoId={videoId}
        />
      </Grid>
    </Grid>
  );
};
