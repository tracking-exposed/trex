import React from 'react';

import {
  Box,
  Card,
  CardMedia,
  Grid,
  Link,
  Typography,
}from '@material-ui/core';
import { Link as LinkIcon } from '@material-ui/icons';

import {
  descriptionMaxLength,
  Recommendation,
  titleMaxLength,
} from '@shared/models/Recommendation';

import { makeStyles } from '../../theme';
import { isYTURL } from '../../utils/yt.utils';
import CharLimitedTypography from '../common/CharLimitedTypography';
import { getHostFromURL } from '../../utils/location.utils';

const imgHeight = 120;

const useStyles = makeStyles((theme) => ({
  link: {
    '&:hover': {
      textDecoration: 'none',
    },
  },
  card: {
    height: imgHeight,
    '& img': {
      objectFit: 'cover',
      height: imgHeight,
      width: '100%',
    },
    backgroundColor: theme.palette.grey[300],
  },
  content: {
    height: `calc(100% - ${theme.spacing(1)}px)`,
    padding: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(1.5),
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    letterSpacing: '0.015em',
    lineHeight: 1.25,
    marginBottom: theme.spacing(0.1),
  },
  description: {
    color: theme.palette.grey[600],
    fontSize: '1.2rem',
    textOverflow: 'ellipsis',
    letterSpacing: '0.015em',
  },
  source: {
    alignItems: 'center',
    color: theme.palette.grey[600],
    display: 'flex',
    fontSize: '1.2rem',
    '& svg': {
      marginTop: -1,
      marginRight: theme.spacing(.5),
    },
  },
  clamped: {
    display: '-webkit-box',
    boxOrient: 'vertical',
    lineClamp: 2,
    wordBreak: 'keep-all',
    overflow: 'hidden'
  },
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
      target={isYouTube ? undefined : '_blank'}
    >
      <Card className={classes.card}>
        <Grid container>
          <Grid item xs={5}>
            <CardMedia component="img" src={image} title={title} />
          </Grid>
          <Grid item xs={7}>
            <Box
              className={classes.content}
              display="flex"
              flexDirection="column"
            >
              <CharLimitedTypography
                className={`${classes.title} ${classes.clamped}`}
                limit={titleMaxLength}
              >
                {title}
              </CharLimitedTypography>
              {!isYouTube && (
                <Typography className={classes.source}>
                  <LinkIcon />
                  {getHostFromURL(url)}
                </Typography>
              )}
              <Box display="flex" flexGrow={1} alignItems="center">
                <CharLimitedTypography
                  className={`${classes.description} ${classes.clamped}`}
                  limit={descriptionMaxLength}
                >
                  {description ?? ''}
                </CharLimitedTypography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Link>
  );
};
