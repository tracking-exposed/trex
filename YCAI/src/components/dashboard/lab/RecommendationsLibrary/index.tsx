import { Box, Grid } from '@material-ui/core';
import { ErrorBox } from '@shared/components/Error/ErrorBox';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import { LazyFullSizeLoader } from 'components/common/FullSizeLoader';
import * as React from 'react';
import { addRecommendation } from '../../../../state/dashboard/creator.commands';
import * as queries from '../../../../state/dashboard/creator.queries';
import AddRecommendationBox from '../AddRecommendationBox';
import RecommendationList from './RecommendationsList';

const RecommendationsLibrary: React.FC = () => {
  const handleRecommendationAdd = React.useCallback((url: string) => {
    void addRecommendation({
      url,
    })();
  }, []);

  return (
    <WithQueries
      queries={{ recommendations: queries.creatorRecommendations }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ recommendations }) => {
        return (
          <Grid container>
            <Grid item md={6}>
              <AddRecommendationBox onAddClick={handleRecommendationAdd} />
              <Box>
                <RecommendationList recommendations={recommendations} />
              </Box>
            </Grid>
          </Grid>
        );
      })}
    />
  );
};

export default RecommendationsLibrary;
