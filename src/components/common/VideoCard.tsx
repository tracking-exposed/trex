import React from 'react';

import {
  Card,
  CardMedia,
  Grid,
  Typography,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/styles';

import { useTranslation } from 'react-i18next';
import { useDrag } from 'react-dnd';

import { getYTThumbnailById } from '../../utils/yt.utils';
import { YCAITheme } from '../../theme';

interface VideoCardProps {
  videoId: string;
  title: string;
  onClick?: (id: string) => void;
}

const useStyles = makeStyles<YCAITheme>(theme => ({
  videoCard: {
    height: '100%',
    '& a, a:visited, a:hover': {
      color: theme.palette.common.black,
      textDecoration: 'none',
    },
  },
  cardGrid: {
    height: '100%',
    '& div img': {
      height: '120px',
      paddingTop: '2%'
    },
    '& > div:not(:first-child) > *:first-child': {
      marginLeft: theme.spacing(1),
    }
  },
  titleHeading: {
    fontSize: '1em',
    fontWeight: 'bold',
  },
  cardActionsGrid: {
    justifyContent: 'space-between',
    alignItems: 'center-end',
    '& button': {
      background: 'none',
      border: 'none',
      color: theme.palette.primary.dark,
      padding: 0,
      margin: 0,
      '&:hover': {
        cursor: 'pointer',
      }
    },
  }
}));

export const VideoCard: React.FC<VideoCardProps> = ({
  videoId,
  title,
  onClick,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const [, drag] = useDrag(() => ({
    type: 'Card',
    item: { videoId, title },
    end: (item, monitor) => {
      // eslint-disable-next-line
      console.log('on drag end', { item, monitor });
      // const dropResult = monitor.getDropResult<DropResult>();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));

  return (
    <Card
      ref={drag}
      className={classes.videoCard}
    >
      <Grid container className={classes.cardGrid}>
        <Grid item xs={12}>
          <CardMedia
            component="img"
            src={getYTThumbnailById(videoId)}
            title={title}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom component="h4" className={classes.titleHeading}>
            <a
              href={'https://youtu.be/' + videoId}
              target="_blank"
              rel="noreferrer"
            >
              {title}
            </a>
          </Typography>
        </Grid>
        <Grid item xs={12} container spacing={1} className={classes.cardActionsGrid}>
          <Grid item>
            <a
              target="_blank"
              rel="noreferrer"
              href={'https://youtube.tracking.exposed/compare/#' + videoId}
            >
              {t('actions:compare')}
            </a>
          </Grid>
          <Grid item>
            <a
              target="_blank"
              rel="noreferrer"
              href={'https://youtube.tracking.exposed/related/#' + videoId}
            >
              {t('actions:related')}
            </a>
          </Grid>
          <Grid item>
            <button
              onClick={() => onClick?.(videoId)}
            >
              {t('actions:add_recommendations')}
            </button>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  );
};
