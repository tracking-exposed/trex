import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Typography,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/styles';

import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';

import { updateRecommendationForVideo } from '../../../state/creator.commands';
import * as queries from '../../../state/public.queries';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { RecommendationCard } from './RecommendationCard';
import { ReorderList } from '../../common/ReorderList';
import { YCAITheme } from '../../../theme';

const withQueries = declareQueries({
  settings: queries.settings,
  videoRecommendations: queries.videoRecommendations,
});

type Queries = typeof withQueries['Props'];

interface VideoRecommendationsProps extends Queries {
  videoId: string;
}

const useStyles = makeStyles<YCAITheme>(theme => ({
  root: {
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: 2 * theme.shape.borderRadius,
    padding: theme.spacing(1),
    paddingTop: theme.spacing(4),
    position: 'relative'
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '-1.75rem',
    textAlign: 'center',
  },
  headerSpan: {
    backgroundColor: 'white',
    display: 'inline-block',
    maxWidth: '70%',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    '& > *': {
      margin: 0,
    }
  },
  empty: {
    textAlign: 'center',
  }
}));

export const VideoRecommendations = withQueries<VideoRecommendationsProps>(
  ({ queries, videoId }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(
        LazyFullSizeLoader,
        ErrorBox,
        ({ settings, videoRecommendations }) => {
          const { t } = useTranslation();
          const classes = useStyles();

          const recElement = videoRecommendations.length > 0 ? (
            <ReorderList
              spacing={1}
              getKey={(item) => item.urlId}
              items={videoRecommendations.map((v, i) => ({
                ...v,
                index: i,
              }))}
              compareItem={(item, dragItem) => {
                return item.urlId !== dragItem.urlId;
              }}
              onDragComplete={(recommendations) => {
                void updateRecommendationForVideo(
                  {
                    videoId,
                    recommendations: recommendations.map((r) => r.urlId),
                  },
                  {
                    videoRecommendations: {
                      videoId,
                    },
                  }
                )();
              }}
              renderItem={(item, i) => (
                <RecommendationCard
                  key={i}
                  data={item}
                  onDeleteClick={(r) => {
                    void updateRecommendationForVideo(
                      {
                        videoId,
                        recommendations: videoRecommendations
                          .map((d) => d.urlId)
                          .filter((dd) => dd !== r.urlId),
                      },
                      {
                        videoRecommendations: {
                          videoId,
                        },
                      }
                    )();
                  }}
                />
              )}
            />
          ) : (
            <div className={classes.empty}>
              <Typography>
                {t('recommendations:no_items')}
              </Typography>
            </div>
          );

          return (
            <Box className={classes.root}>
              <div className={classes.header}>
                <span className={classes.headerSpan}>
                  <Typography
                    color="primary"
                    component="h6"
                    variant="h5"
                  >
                    {t('actions:drag_drop_recommendations')}
                  </Typography>
                </span>
              </div>
              {recElement}
            </Box>
          );
        }
      )
    );
  }
);
