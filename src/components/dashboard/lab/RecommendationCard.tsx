import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  IconButton,
  Card,
  Grid,
} from '@material-ui/core';

import {
  Delete as DeleteIcon,
} from '@material-ui/icons';

import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/styles';

import { Recommendation } from '@backend/models/Recommendation';
import { YCAITheme } from '../../../theme';
import Image from '../../common/Image';

interface RecommendationCardProps {
  data: Recommendation;
  onDeleteClick: (r: Recommendation) => void;
}

const useStyles = makeStyles<YCAITheme>((theme) => ({
  root: {
    height: 120,
    overflow: 'hidden',
    backgroundColor: theme.palette.grey[300],
  },
  imageContainer: {
    '& img': {
      height: 120,
      width: '100%',
      objectFit: 'cover',
    }
  },
  delete: {
    textAlign: 'right',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1rem'
  }
}));

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  data,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <Grid container spacing={1}>
        <Grid item xs={5}>
          <div className={classes.imageContainer}>
            <Image
              src={data.image}
              title={data.title}
            />
          </div>
        </Grid>
        <Grid item xs={5}>
          <Typography
            className={classes.title}
            color="textSecondary"
            component="h4"
            gutterBottom
            variant="h6"
          >
            {data.title}

          </Typography>
          <Typography variant="body2" color="textSecondary" component="small">
            {data.description}
          </Typography>
        </Grid>
        <Grid item xs={2} className={classes.delete}>
          <IconButton
            aria-label={t('actions:removeFromCurrentVideo')}
            color="primary"
            onClick={() => onDeleteClick(data)}
          >
            <DeleteIcon />
          </IconButton>
        </Grid>

      </Grid>
    </Card>
  );
};
