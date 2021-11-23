import React from 'react';
import {
  Card,
  CardMedia,
  Grid,
  Link,
  Typography,
}from '@material-ui/core';

import { Recommendation } from '@backend/models/Recommendation';
import { makeStyles, YCAITheme } from '../../theme';
import { isYTURL } from '../../utils/yt.utils';

const useStyles = makeStyles<YCAITheme>(theme => ({
  link: {
    '&:hover': {
      textDecoration: 'none',
    }
  },
  card: {
    height: 100,
    '& img': {
      height: '100%',
    },
  },
  content: {
    padding: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
  },
  title: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
  },
  description: {
    textOverflow: 'ellipsis',
  }
}));

export const InjectedRecommendationCard: React.FC<Recommendation> = ({
  image,
  url,
  title,
  description,
}) => {
  const classes = useStyles();
  const isYouTube = isYTURL(url);

  return (
    <Link
      className={classes.link}
      href={url}
      rel="noreferrer"
      target={isYouTube ? undefined: '_blank'}
    >
      <Card className={classes.card}>
        <Grid container>
          <Grid item xs={5}>
            <CardMedia
              component="img"
              src={image}
              title={title}
            />
          </Grid>
          <Grid item xs={7} className={classes.content}>
            <Typography className={classes.title}>
              {title}
            </Typography>
            <Typography className={classes.description}>
              {description}
            </Typography>
          </Grid>
        </Grid>
      </Card>
    </Link>
  );
};
