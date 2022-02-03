import { Card, CardContent, CardHeader, useTheme } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { ErrorBox } from '@shared/components/Error/ErrorBox';
import { ContentCreator } from '@shared/models/ContentCreator';
import { Taboule } from '@taboule/components/Taboule';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../../config';
import {
  ccRelatedUsers,
  profile,
} from '../../../state/dashboard/creator.queries';
import { makeStyles } from '../../../theme';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { LinkAccountButton } from '../../common/LinkAccountButton';
import { StatsCard } from '../../common/StatsCard';
import { ADVChannelStatsBox } from './ADVChannelStatsBox';
import { DonutChart } from './DonutChart';

const useStyles = makeStyles((theme) => ({
  recommendabilityScore: {
    background: theme.palette.primary.main,
    borderRadius: theme.spacing(1),
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
}

const CreatorAnalyticsPage: React.FC<CreatorAnalyticsPageProps> = ({
  profile,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const { t } = useTranslation();

  const amount = 25;
  return (
    <Grid item md={12}>
      {profile === undefined ? (
        <LinkAccountButton />
      ) : (
        <WithQueries
          queries={{ stats: ccRelatedUsers }}
          params={{ stats: { params: { amount, skip: 0 } } }}
          render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ stats }) => {
            return (
              <Grid container spacing={2}>
                <Grid item md={3} sm={6}>
                  <Card className={classes.recommendations}>
                    <CardHeader title={t('analytics:recommendations_title')} />
                    <CardContent>
                      <Grid
                        container
                        direction="column"
                        alignContent="flex-start"
                        justifyContent="center"
                      >
                        <Grid item sm={12}>
                          <StatsCard
                            header={t('analytics:total_recommendations')}
                            count={stats.totalRecommendations}
                          />
                        </Grid>
                        <Grid item sm={12}>
                          <StatsCard
                            header={t('analytics:total_contributions')}
                            count={stats.totalContributions}
                            color={theme.palette.primary.main}
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
                          other: theme.palette.grey[300],
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item md={5}>
                  <Card className={classes.relatedChannels}>
                    <CardHeader
                      title={t('analytics:top_n_cc_related_to_your_channel', {
                        count: amount,
                      })}
                    />
                    <CardContent style={{ paddingTop: 0 }}>
                      <Taboule
                        height={500}
                        showInput={false}
                        query="ccRelatedUsers"
                        baseURL={config.API_URL}
                        initialParams={{
                          channelId: profile.channelId,
                        }}
                      />
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

const withQueries = declareQueries({ profile });

export const AnalyticsPage = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile }) => {
      return (
        <Grid container spacing={3}>
          <Grid item md={12}>
            <CreatorAnalyticsPage profile={profile} />
          </Grid>
        </Grid>
      );
    })
  );
});
