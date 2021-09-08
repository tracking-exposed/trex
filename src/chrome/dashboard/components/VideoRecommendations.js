import { Box, Chip, Grid, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import React from 'react';
import { videoRecommendations } from '../API/queries';
import { ErrorBox } from './common/ErrorBox';
import { LazyFullSizeLoader } from './common/FullSizeLoader';
import DeleteIcon from '@material-ui/icons/Delete';
import { updateRecommendationForVideo } from '../API/commands';

export class VideoRecommendations extends React.PureComponent {
  render () {
    const { videoId } = this.props;
    return (
      <Box>
        <Typography variant="h5">Recommendations</Typography>
        <WithQueries
          queries={{ recommendations: videoRecommendations }}
          params={{ recommendations: { videoId } }}
          render={QR.fold(
            LazyFullSizeLoader,
            ErrorBox,
            ({ recommendations }) => {
              if (!recommendations) {
                return 'No video selected';
              }
              return recommendations.map((r, i) => (
                <Grid
                  container
                  alignItems="center"
                  justifyContent="flex-start"
                  style={{ marginBottom: 10 }}
                >
                  <Grid item md={2}>
                    <Chip
                      label={i + 1}
                      variant="outlined"
                      deleteIcon={<DeleteIcon />}
                      onDelete={() =>
                        updateRecommendationForVideo({
                          videoId,
                          recommendations: recommendations
                            .map((r) => r.urlId)
                            .filter((rr) => rr !== r.urlId)
                        })()
                      }
                    />
                  </Grid>
                  <Grid
                    item
                    md={10}
                    alignItems="flex-start"
                    alignContent="flex-start"
                  >
                    <p>{r.title}</p>
                  </Grid>
                </Grid>
              ));
            }
          )}
        />
      </Box>
    );
  }
}
