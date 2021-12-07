import React from 'react';

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Link,
  useTheme,
  makeStyles,
} from '@material-ui/core';

import { useTranslation } from 'react-i18next';

import {
  getYTMaxResThumbnailById,
  getYTVideoURLById,
} from '../../../utils/yt.utils';

import { YCAITheme } from '../../../theme';

interface VideoCardProps {
  videoId: string;
  title: string;
  openRecommendations: () => void;
}

const useStyles = makeStyles<YCAITheme>((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .MuiCardContent-root': {
      flexGrow: 1,
    },
    backgroundColor: theme.palette.grey[300],
    '& img:hover': {
      cursor: 'pointer',
    },
    boxShadow: "none",
  },
  customBox: {
    display: '-webkit-box',
    boxOrient: 'vertical',
    lineClamp: 2,
    wordBreak: 'keep-all',
    overflow: 'hidden'
  },
}));

export const VideoCard: React.FC<VideoCardProps> = ({
  videoId,
  title,
  openRecommendations,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const theme = useTheme();

  return (
    <Card className={classes.root} style={{ boxShadow: 'none' }}>
      <CardMedia
        component="img"
        src={getYTMaxResThumbnailById(videoId)}
        title={title}
        height={120}
        onClick={openRecommendations}
      />
      <CardContent style={{ paddingBottom: theme.spacing(0.3) }} classes={{root: classes.customBox}}>
        <Link
          color="textSecondary"
          href={getYTVideoURLById(videoId)}
          rel="noreferrer"
          target="_blank"
          underline="none"
          variant="subtitle2"
        >
          {title}
        </Link>
      </CardContent>
      <CardActions style={{ paddingLeft: theme.spacing(1.5), paddingTop: theme.spacing(0)}}>
        <Button
          color="primary"
          variant="text"
          size="small"
          className={classes.manage}
          onClick={openRecommendations}
        >
          {t('actions:manage_recommendations')}
        </Button>
      </CardActions>
    </Card>
  );
};
