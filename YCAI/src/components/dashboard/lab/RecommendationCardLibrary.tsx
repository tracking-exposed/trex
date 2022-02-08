import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  // Button,
  IconButton,
  Card,
  Grid,
  Link,
} from '@material-ui/core';

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Link as LinkIcon,
} from '@material-ui/icons';

import { makeStyles } from '@material-ui/styles';

import {
  titleMaxLength,
  descriptionMaxLength,
  Recommendation,
} from '@shared/models/Recommendation';
import { YCAITheme } from '../../../theme';
import CharLimitedTypography from '../../common/CharLimitedTypography';
import Image from '../../common/Image';
// import EditRecommendation from './EditRecommendation';
import { isYTURL } from '../../../utils/yt.utils';
import { getHostFromURL } from '../../../utils/location.utils';

interface RecommendationCardProps {
  videoId: string;
  data: Recommendation;
  onDeleteClick: (r: Recommendation) => void;
}

const cardHeight = 140;

const useStyles = makeStyles<YCAITheme>((theme) => ({
  root: {
    height: cardHeight,
    overflow: 'hidden',
    marginBottom: '10px',
    boxShadow: 'none',
    borderRadius: '8px',
    backgroundColor: theme.palette.background.paper,
    '& a:hover': {
      cursor: 'pointer',
    },
  },
  imageContainer: {
    '& img': {
      height: cardHeight,
      width: '100%',
      objectFit: 'cover',
    },
  },
  body: {
    height: cardHeight,
    overflow: 'hidden',
  },
  right: {
    paddingLeft: theme.spacing(2),
    padding: theme.spacing(2),
    height: `calc(100% - ${theme.spacing(2)}px)`,
  },
  title: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    lineHeight: 1.2,
    lineClamp: 3,
  },
  iconsContainer: {
    display: 'flex',
    flexDirection: 'column-reverse',
    justifyContent: 'flex-end',
    // alignItems: 'flex-start',
    '& > *': {
      marginRight: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
  },
  arrowButton: {
    '&:disabled': {
      color: theme.palette.grey[500],
    },
  },
  button: {
    fontWeight: 'bold',
    lineHeight: 1,
    marginRight: theme.spacing(3),
    minWidth: 0,
    padding: 0,
  },
  source: {
    alignItems: 'center',
    color: theme.palette.grey[500],
    display: 'flex',
    fontSize: '0.8rem',
    '& svg': {
      marginTop: 0,
      marginRight: theme.spacing(0.5),
    },
    '&:hover': {
      color: theme.palette.secondary.main,
    },
  },
  clamped: {
    display: '-webkit-box',
    boxOrient: 'vertical',
    wordBreak: 'keep-all',
    overflow: 'hidden',
  },
  description: {
    color: theme.palette.grey[500],
    lineClamp: 3,
  },
}));

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  data,
  videoId,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const isYT = isYTURL(data.url);
  const isExternal = !isYT;

  return (
    <Card className={classes.root}>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <div className={classes.imageContainer}>
            <Image src={data.image} title={data.title} />
          </div>
        </Grid>

        <Grid item xs={8} className={classes.body}>
          <Box className={classes.right} display="flex" flexDirection="column">
            <CharLimitedTypography
              className={`${classes.title} ${classes.clamped}`}
              color="textSecondary"
              component="h6"
              gutterBottom
              limit={titleMaxLength}
              variant="h6"
            >
              {data.title}
            </CharLimitedTypography>
            {isExternal && (
              <Link href={data.url} target="_blank" className={classes.source}>
                <LinkIcon />
                {getHostFromURL(data.url)}
              </Link>
            )}

            <Box flexGrow={8} display="flex" alignItems="center">
              <CharLimitedTypography
                className={`${classes.description} ${classes.clamped}`}
                color="textSecondary"
                limit={descriptionMaxLength}
                variant="body2"
              >
                {data.description ?? t('recommendations:missing_description')}
              </CharLimitedTypography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={1} className={classes.iconsContainer}>
          <IconButton
            aria-label={t('actions:move_recommendation_up')}
            color="primary"
            className={classes.arrowButton}
            // there seems to be an eslint bug,
            // there is no way to get rid of all the warnings whatever I do
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            onClick={() => onDeleteClick(data)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            aria-label={t('actions:move_recommendation_down')}
            color="primary"
            className={classes.arrowButton}
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            size="small"
          >
            <EditIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Card>
  );
};
