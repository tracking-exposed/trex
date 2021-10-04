import { Button, CardActions } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import { Recommendation } from '@models/Recommendation';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface RecommendationCardProps {
  data: Recommendation;
  alreadyPresent: boolean;
  onAddClick?: (r: Recommendation) => void;
  onDeleteClick?: (r: Recommendation) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  data,
  alreadyPresent,
  onAddClick,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const addButton =
    !alreadyPresent && onAddClick !== undefined ? (
      <CardActions>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => {
            onAddClick(data);
          }}
        >
          {t('actions:addToCurrentVideo')}
        </Button>
      </CardActions>
    ) : null;

  const deleteButton =
    alreadyPresent && onDeleteClick !== undefined ? (
      <CardActions>
        <Button
          size="small"
          variant="contained"
          color="secondary"
          onClick={() => onDeleteClick(data)}
        >
          {t('actions:removeFromCurrentVideo')}
        </Button>
      </CardActions>
    ) : null;

  return (
    <Card
      style={{
        textAlign: 'left',
        margin: '6px',
      }}
    >
      {data.image !== undefined ? (
        <CardMedia
          component="img"
          style={{ height: '120px', paddingTop: '2%' }}
          src={data.image}
          title={data.title}
        />
      ) : (
        <small>
          🗲<code>𝕟𝕠 𝕡𝕚𝕔𝕥𝕦𝕣𝕖</code>
        </small>
      )}
      <CardContent>
        <Typography gutterBottom variant="h5" component="h4">
          {data.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" component="small">
          {data.description}
        </Typography>
      </CardContent>
      <CardActionArea>{addButton ?? deleteButton}</CardActionArea>
    </Card>
  );
};
