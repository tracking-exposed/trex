import { Card, CardContent, CardHeader, useTheme } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { ContentCreator } from '@shared/models/ContentCreator';
import { CreatorStatContent, CreatorStats } from '@shared/models/CreatorStats';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  creatorStats,
  profile,
} from '../../../state/dashboard/creator.queries';
import { makeStyles } from '../../../theme';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { LinkAccountButton } from '../../common/LinkAccountButton';
import { StatsCard } from '../../common/StatsCard';
import { ADVChannelStatsBox } from './ADVChannelStatsBox';
import { CCRelatedUserList } from './CCRelatedUserList';
import { DonutChart } from './DonutChart';

const useStyles = makeStyles((theme) => ({
  recommendabilityScore: {
    background: theme.palette.primary.main,
    '& .MuiCardHeader-content .MuiCardHeader-title': {
      color: theme.palette.common.white,
      ...theme.typography.h4,
    },
    '& .MuiCardHeader-content .MuiCardHeader-subheader': {
      color: theme.palette.common.white,
      ...theme.typography.h6,
    },
  },
  relatedChannels: {
    boxShadow: 'none',
    background: 'transparent',
    '& .MuiCardHeader-content .MuiCardHeader-title': {
      color: theme.palette.primary.main,
      ...theme.typography.h4,
    },
    '& .MuiCardHeader-content .MuiCardHeader-subheader': {
      color: theme.palette.primary.main,
      ...theme.typography.h6,
    },
  },
  recommendations: {
    boxShadow: 'none',
    background: 'transparent',
    '& .MuiCardHeader-content .MuiCardHeader-title': {
      color: theme.palette.primary.main,
      ...theme.typography.h4,
    },
    '& .MuiCardHeader-content .MuiCardHeader-subheader': {
      color: theme.palette.primary.main,
      ...theme.typography.h6,
    },
  },
}));

interface CreatorAnalyticsPageProps {
  profile?: ContentCreator;
  stats: CreatorStats;
}

const CreatorAnalyticsPage: React.FC<CreatorAnalyticsPageProps> = ({
  profile,
  stats,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const { t } = useTranslation();

  const recommendations = React.useMemo(
    () =>
      pipe(
        stats.content,
        A.reduce(
          {
            self: [] as CreatorStatContent[],
            other: [] as CreatorStatContent[],
            totalViews: 0,
          },
          (acc, s) => {
            const totalViews = acc.totalViews + s.recommendedViews;
            const updatedRecommendations =
              s.recommendedChannel === stats.authorName
                ? {
                    self: acc.self.concat(s),
                  }
                : {
                    other: acc.other.concat(s),
                  };

            return {
              ...acc,
              ...updatedRecommendations,
              totalViews,
            };
          }
        ),
        (s) => {
          const total = s.self.length + s.other.length;
          const recommendabilityScore =
            s.self.length === 0 && s.other.length === 0
              ? 0
              : (s.self.length / s.other.length) * 100;
          return {
            recommendabilityScore,
            total,
            ...s,
          };
        }
      ),
    [stats]
  );

  return (
    <Grid item md={12}>
      {profile === undefined ? (
        <LinkAccountButton />
      ) : (
        <Grid container spacing={2}>
          <Grid item md={4}>
            <Card className={classes.relatedChannels}>
              <CardHeader
                title={t('analytics:top_n_cc_related_to_your_channel', {
                  count: 5,
                })}
              />
              <CardContent>
                <CCRelatedUserList
                  channelId={profile.channelId}
                  amount={5}
                  skip={0}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item md={4}>
            <Card className={classes.recommendabilityScore}>
              <CardHeader
                title={t('analytics:recommendability_score_title')}
                subheader={t('analytics:recommendability_score_subtitle')}
              />
              <CardContent>
                <DonutChart
                  id="creator-recommendations-score"
                  title={`${
                    recommendations.recommendabilityScore < 10
                      ? recommendations.recommendabilityScore.toFixed(1)
                      : recommendations.recommendabilityScore.toFixed(0)
                  }%`}
                  data={{
                    recommended: [recommendations.recommendabilityScore],
                    other: [100 - recommendations.recommendabilityScore],
                  }}
                  colors={{
                    recommended: theme.palette.common.white,
                    other: theme.palette.grey[500],
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item md={4} sm={6}>
            <Card className={classes.recommendations}>
              <CardHeader title={t('analytics:recommendations_title')} />
              <CardContent>
                <Grid
                  container
                  spacing={2}
                  direction="column"
                  alignContent="center"
                  justifyContent="center"
                >
                  <Grid item md={10}>
                    <StatsCard
                      header={t('analytics:total_recommendations')}
                      count={recommendations.total}
                      color={theme.palette.primary.main}
                    />
                  </Grid>
                  <Grid item md={10}>
                    <StatsCard
                      header={t('analytics:recommendations_for_other_channels')}
                      count={recommendations.other.length}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item md={12}>
            <ADVChannelStatsBox />
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

const withQueries = declareQueries({ profile, creatorStats });

export const AnalyticsPage = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile, creatorStats }) => {
      return (
        <Grid container spacing={3}>
          <Grid item md={12}>
            <CreatorAnalyticsPage profile={profile} stats={creatorStats} />
          </Grid>
        </Grid>
      );
    })
  );
});
