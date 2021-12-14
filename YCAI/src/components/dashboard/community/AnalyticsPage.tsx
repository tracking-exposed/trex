import { Card, CardContent, CardHeader, useTheme } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { ContentCreator } from '@shared/models/ContentCreator';
import { CreatorStats } from '@shared/models/CreatorStats';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ccRelatedUsers,
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
import * as QR from 'avenger/lib/QueryResult';

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

  return (
    <Grid item md={12}>
      {profile === undefined ? (
        <LinkAccountButton />
      ) : (
        <WithQueries
          queries={{ stats: ccRelatedUsers }}
          params={{ stats: { params: { amount: 5, skip: 0 } } }}
          render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ stats }) => {
            return (
              <Grid container spacing={2}>
                <Grid item md={4} sm={6}>
                  <Card className={classes.recommendations}>
                    <CardHeader
                      title={t('analytics:recommendations_title')}
                      style={{
                        textAlign: 'center',
                      }}
                    />
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
                            header={t('analytics:total_metadata')}
                            count={stats.totalMetadata}
                            color={theme.palette.primary.main}
                          />
                        </Grid>
                        <Grid item md={10}>
                          <StatsCard
                            header={t(
                              'analytics:total_recommendations'
                            )}
                            count={stats.totalRecommendations}
                          />
                        </Grid>
                      </Grid>
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
                        title={`${stats.score}%`}
                        data={{
                          recommended: [stats.score],
                          other: [100 - stats.score],
                        }}
                        colors={{
                          recommended: theme.palette.common.white,
                          other: theme.palette.grey[500],
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item md={4}>
                  <Card className={classes.relatedChannels}>
                    <CardHeader
                      title={t('analytics:top_n_cc_related_to_your_channel', {
                        count: 5,
                      })}
                    />
                    <CardContent>
                      <CCRelatedUserList channels={stats.content} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item md={12}>
                  <ADVChannelStatsBox />
                </Grid>
              </Grid>
            );
          })}
        />
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
