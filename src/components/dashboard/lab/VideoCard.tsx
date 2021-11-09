import React from 'react';

import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Link,
  Typography,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/styles';
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

const useStyles = makeStyles<YCAITheme>(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '& .MuiCardContent-root': {
      flexGrow: 1,
    }
  },
  manage: {
    fontWeight: 'bold',
    fontSize: '0.8rem',
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(2),
  }
}));

export const VideoCard: React.FC<VideoCardProps> = ({
  videoId,
  title,
  openRecommendations,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardActionArea onClick={openRecommendations}>
        <CardMedia
            component="img"
            src={getYTMaxResThumbnailById(videoId)}
            title={title}
          />
        <CardContent>
          <Link
            color="textPrimary"
            href={getYTVideoURLById(videoId)}
            rel="noreferrer"
            target="_blank"
            underline="none"
            variant="subtitle1"
          >
            {title}
          </Link>
        </CardContent>
        <Typography
          color="primary"
          className={classes.manage}
        >
          {t('actions:manage_recommendations')}
        </Typography>
      </CardActionArea>
    </Card>
  );
};