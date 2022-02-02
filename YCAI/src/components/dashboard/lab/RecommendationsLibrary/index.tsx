import { Box, Grid } from '@material-ui/core';
import { ErrorBox } from '@shared/components/Error/ErrorBox';
import { Recommendation } from '@shared/models/Recommendation';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import * as React from 'react';
import {
  addRecommendation,
  deleteRecommendation,
} from '../../../../state/dashboard/creator.commands';
import * as queries from '../../../../state/dashboard/creator.queries';
import { LazyFullSizeLoader } from '../../../common/FullSizeLoader';
import AddRecommendationBox from '../AddRecommendationBox';
import RecommendationList from './RecommendationsList';

const RecommendationsLibrary: React.FC = () => {
  const handleRecommendationAdd = React.useCallback((url: string) => {
    void addRecommendation({
      url,
    })();
  }, []);

  const handleRecommendationDelete = React.useCallback((r: Recommendation) => {
    void deleteRecommendation({
      urlId: r.urlId,
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
                <RecommendationList
                  recommendations={recommendations}
                  onDeleteClick={handleRecommendationDelete}
                />
              </Box>
            </Grid>
          </Grid>
        );
      })}
    />
  );
};

export default RecommendationsLibrary;
