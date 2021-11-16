import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  IconButton,
  Card,
  Grid,
} from '@material-ui/core';

import {
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@material-ui/icons';

import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/styles';

import { Recommendation } from '@backend/models/Recommendation';
import { YCAITheme } from '../../../theme';
import Image from '../../common/Image';

interface RecommendationCardProps {
  data: Recommendation;
  onDeleteClick: () => void;
  onMoveUpClick: (() => void) | false;
  onMoveDownClick: (() => void) | false;
}

const cardHeight = 140;

const useStyles = makeStyles<YCAITheme>((theme) => ({
  root: {
    height: cardHeight,
    overflow: 'hidden',
    backgroundColor: theme.palette.grey[300],
  },
  imageContainer: {
    '& img': {
      height: cardHeight,
      width: '100%',
      objectFit: 'cover',
    }
  },
  body: {
    height: cardHeight,
    overflow: 'hidden',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  iconsContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    '& > *': {
      marginRight: theme.spacing(1),
    },
  },
}));

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  data,
  onDeleteClick,
  onMoveUpClick,
  onMoveDownClick,
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

        <Grid
          item xs={6}
          className={classes.body}
        >
          <Box p={2}>
            <Typography
              className={classes.title}
              color="textSecondary"
              component="h4"
              gutterBottom
              variant="h6"
            >
              {data.title}

            </Typography>
            <Typography
              color="textSecondary"
              variant="body2"
            >
              {data.description}
            </Typography>
          </Box>
        </Grid>

        <Grid
          item
          xs={1}
          className={classes.iconsContainer}
        >
          <IconButton
              aria-label={t('actions:move_recommendation_up')}
              color="primary"
              disabled={onMoveUpClick === false}
              // there seems to be an eslint bug,
              // there is no way to get rid of all the warnings whatever I do
              // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
              onClick={onMoveUpClick || undefined}
              size="small"
              >
              <ArrowUpwardIcon />
          </IconButton>
          <IconButton
              aria-label={t('actions:move_recommendation_down')}
              color="primary"
              disabled={onMoveDownClick === false}
              // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
              onClick={onMoveDownClick || undefined}
              size="small"
              >
              <ArrowDownwardIcon />
          </IconButton>
          <IconButton
            aria-label={t('actions:remove_recommendation_from_video')}
            color="primary"
            onClick={onDeleteClick}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Grid>

      </Grid>
    </Card>
  );
};
