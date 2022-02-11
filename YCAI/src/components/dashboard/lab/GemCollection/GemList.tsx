import { Box, Grid, Typography } from '@material-ui/core';
import { Recommendation } from '@shared/models/Recommendation';
import React from 'react';
import { useTranslation } from 'react-i18next';
import GemCard from './GemCard';

interface GemListProps {
  recommendations: Recommendation[];
  onDeleteClick: (r: Recommendation) => void;
}

const RecommendationList: React.FC<GemListProps> = ({
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
          <Grid item xs={10} sm={10} md={10} lg={6} key={r.urlId}>
            <GemCard key={r.urlId} data={r} onDeleteClick={onDeleteClick} />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default RecommendationList;
