import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  IconButton,
  Card,
  Grid,
} from '@material-ui/core';

import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@material-ui/icons';

import { makeStyles } from '@material-ui/styles';

import {
  titleMaxLength,
  descriptionMaxLength,
  Recommendation
} from '@shared/models/Recommendation';
import { YCAITheme } from '../../../theme';
import CharLimitedTypography from '../../common/CharLimitedTypography';
import Image from '../../common/Image';
import EditRecommendation from './EditRecommendation';

interface RecommendationCardProps {
  videoId: string;
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
    '& a:hover': {
      cursor: 'pointer',
    },
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
  right: {
    paddingLeft: theme.spacing(0.7),
    padding: theme.spacing(2),
    height: `calc(100% - ${theme.spacing(2)}px)`,
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1rem',
    lineHeight: 1,
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
  button: {
    lineHeight: 1,
    marginRight: theme.spacing(2),
    minWidth: 0,
    padding: 0,
  }
}));

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  data,
  videoId,
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
          <Box
            className={classes.right}
            display="flex"
            flexDirection="column"
          >
            <CharLimitedTypography
              className={classes.title}
              color="textSecondary"
              component="h6"
              gutterBottom
              limit={titleMaxLength}
              variant="h6"
            >
              {data.title}
            </CharLimitedTypography>
            <Box flexGrow={1}>
              <CharLimitedTypography
                color="textSecondary"
                limit={descriptionMaxLength}
                variant="body2"
              >
                {data.description ?? t('recommendations:missing_description')}
              </CharLimitedTypography>
            </Box>
            <Box>
              <Button
                className={classes.button}
                onClick={onDeleteClick}
                size="small"
                variant="text"
              >
                {t('actions:delete_recommendation_button')}
              </Button>
              <EditRecommendation
                className={classes.button}
                color="primary"
                variant="text"
                size="small"
                data={data}
                videoId={videoId}
              />
            </Box>
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
        </Grid>
      </Grid>
    </Card>
  );
};
