import { Box, Grid, Typography } from '@material-ui/core';
import { Recommendation } from '@shared/models/Recommendation';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RecommendationCard } from '../RecommendationCardLibrary';

interface RecommendationListProps {
  recommendations: Recommendation[];
  onDeleteClick: (r: Recommendation) => void;
}

const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  onDeleteClick,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Box mb={2}>
        <Typography>
          {t('recommendations:total')} {recommendations.length}
        </Typography>
      </Box>
      <Grid container spacing={2} style={{ paddingRight: '200px' }}>
        {recommendations.map((r) => (
          <Grid item xs={10} sm={6} lg={5} key={r.urlId}>
            <RecommendationCard
              key={r.urlId}
              data={r}
              videoId={''}
              onDeleteClick={onDeleteClick}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default RecommendationList;
