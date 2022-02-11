import { Box, Card, Grid, IconButton, Typography } from '@material-ui/core';
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Link as LinkIcon,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import {
  descriptionMaxLength,
  Recommendation,
  titleMaxLength,
} from '@shared/models/Recommendation';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { YCAITheme } from '../../../../theme';
import { getHostFromURL } from '../../../../utils/location.utils';
import { isYTURL } from '../../../../utils/yt.utils';
import DeleteGemButton from '../../../buttons/DeleteGemButton';
import CharLimitedTypography from '../../../common/CharLimitedTypography';
import { ImageWithGemPlaceholder } from '../../../common/Image';
import EditRecommendation from '../EditRecommendation';

interface RecommendationCardProps {
  edit?: { videoId: string };
  data: Recommendation;
  onDeleteClick: (r: Recommendation) => void;
  onMoveUpClick?: (() => void) | false;
  onMoveDownClick?: (() => void) | false;
  onEditCompleted: (d: Recommendation) => void;
}

const cardHeight = 140;

const useStyles = makeStyles<YCAITheme>((theme) => ({
  root: {
    height: cardHeight,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.default,
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
    paddingLeft: theme.spacing(0.7),
    padding: theme.spacing(2),
    height: `calc(100% - ${theme.spacing(2)}px)`,
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1rem',
    lineHeight: 1,
    lineClamp: 2,
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
  arrowButton: {
    '&:disabled': {
      color: theme.palette.grey[500],
    },
  },
  button: {
    fontWeight: 'bold',
    lineHeight: 1,
    marginRight: theme.spacing(2),
    minWidth: 0,
    padding: 0,
  },
  source: {
    alignItems: 'center',
    color: theme.palette.grey[500],
    display: 'flex',
    fontSize: '0.8rem',
    '& svg': {
      marginTop: -1,
      marginRight: theme.spacing(0.5),
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

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  data,
  edit,
  onEditCompleted,
  onDeleteClick,
  onMoveUpClick,
  onMoveDownClick,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const isYT = isYTURL(data.url);
  const isExternal = !isYT;

  return (
    <Card className={classes.root}>
      <Grid container spacing={1}>
        <Grid item xs={5}>
          <div className={classes.imageContainer}>
            <ImageWithGemPlaceholder src={data.image} title={data.title} />
          </div>
        </Grid>

        <Grid item xs={6} className={classes.body}>
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
              <Typography className={classes.source}>
                <LinkIcon />
                {getHostFromURL(data.url)}
              </Typography>
            )}

            <Box flexGrow={1} display="flex" alignItems="center">
              <CharLimitedTypography
                className={`${classes.description} ${classes.clamped}`}
                color="textSecondary"
                limit={descriptionMaxLength}
                variant="body2"
              >
                {data.description ?? t('recommendations:missing_description')}
              </CharLimitedTypography>
            </Box>
            <Box>
              <DeleteGemButton data={data} onDeleteClick={onDeleteClick} />
              <EditRecommendation
                className={classes.button}
                color="primary"
                variant="text"
                size="small"
                data={data}
                onEditCompleted={onEditCompleted}
              />
            </Box>
          </Box>
        </Grid>

        <Grid item xs={1} className={classes.iconsContainer}>
          {onMoveUpClick !== undefined && (
            <IconButton
              aria-label={t('actions:move_recommendation_up')}
              color="primary"
              className={classes.arrowButton}
              disabled={onMoveUpClick === false}
              // there seems to be an eslint bug,
              // there is no way to get rid of all the warnings whatever I do
              // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
              onClick={onMoveUpClick || undefined}
              size="small"
            >
              <ArrowUpwardIcon />
            </IconButton>
          )}
          {onMoveDownClick !== undefined && (
            <IconButton
              aria-label={t('actions:move_recommendation_down')}
              color="primary"
              className={classes.arrowButton}
              disabled={onMoveDownClick === false}
              // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
              onClick={onMoveDownClick || undefined}
              size="small"
            >
              <ArrowDownwardIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
    </Card>
  );
};

export default RecommendationCard;
