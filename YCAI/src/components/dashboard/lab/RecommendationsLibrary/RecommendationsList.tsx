import { List, Typography } from '@material-ui/core';
import { Recommendation } from '@shared/models/Recommendation';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RecommendationCard } from '../RecommendationCard';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
}) => {
  const { t } = useTranslation();

  return (
    <List>
      <Typography>
        {t('recommendations:total')} {recommendations.length}
      </Typography>
      {recommendations.map((r, index) => {
        return (
          <RecommendationCard
            key={r.urlId}
            data={r}
            videoId={''}
            onDeleteClick={() => {}}
            onMoveDownClick={() => {}}
            onMoveUpClick={() => {}}
          />
        );
      })}
    </List>
  );
};

export default RecommendationList;
