import { ContentCreator } from '@shared/models/ContentCreator';
import { CreatorStatContent, CreatorStats } from '@shared/models/CreatorStats';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import CommunityIcon from '@material-ui/icons/GroupOutlined';
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
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { LinkAccountButton } from '../../common/LinkAccountButton';
import { StatsCard } from '../../common/StatsCard';
import { ADVChannelStatsBox } from './ADVChannelStatsBox';
import { CCRelatedUserList } from './CCRelatedUserList';
import { DonutChart } from './DonutChart';
import { makeStyles } from '../../../theme';

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
            community: [] as CreatorStatContent[],
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
                    community: acc.community.concat(s),
                  };

            return {
              ...acc,
              ...updatedRecommendations,
              totalViews,
            };
          }
        ),
        (s) => {
          const total = s.self.length + s.community.length;
          const recommendabilityScore =
            s.self.length === 0 && s.community.length === 0
              ? 0
              : (s.self.length / s.community.length) * 100;
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
          <Grid item md={4}>
            <Typography variant="h5" color="primary">
              {t('analytics:top_n_cc_related_to_your_channel', {
                count: 5,
              })}
            </Typography>
            <CCRelatedUserList
              channelId={profile.channelId}
              amount={5}
              skip={0}
            />
          </Grid>

          <Grid item md={4} sm={6}>
            <Grid container spacing={2} direction="column" alignContent="center" justifyContent="center">
              <Grid item md={10}>
                <StatsCard
                  icon={<CommunityIcon />}
                  header={t('analytics:total_recommendations')}
                  count={recommendations.total}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item md={10}>
                <StatsCard
                  header={t('analytics:total_views')}
                  count={recommendations.totalViews}
                />
              </Grid>
            </Grid>
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
