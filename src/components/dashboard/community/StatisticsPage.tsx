import { ContentCreator } from '@backend/models/ContentCreator';
import { CreatorStatContent, CreatorStats } from '@backend/models/CreatorStats';
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
import { creatorStats, profile } from '../../../state/creator.queries';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { LinkAccountButton } from '../../common/LinkAccountButton';
import { StatsCard } from '../../common/StatsCard';
import { ADVChannelStatsBox } from './ADVChannelStatsBox';
import { CCRelatedUserList } from './CCRelatedUserList';
import { DonutChart } from './DonutChart';

interface CreatorStatsProps {
  profile?: ContentCreator;
  stats: CreatorStats;
}

const CreatorStatsPage: React.FC<CreatorStatsProps> = ({ profile, stats }) => {
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
            <Card>
              <CardHeader
                title={t('statistics:recommendability_score_title')}
                subheader={t('statistics:recommendability_score_subtitle')}
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
                    score: [recommendations.recommendabilityScore],
                    rest: [100 - recommendations.recommendabilityScore],
                  }}
                  colors={{
                    score: theme.palette.primary.main,
                    rest: theme.palette.grey[500],
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item md={4}>
            <Typography variant="h5" color="primary">
              {t('statistics:top_n_cc_related_to_your_channel', {
                count: 5,
              })}
            </Typography>
            <CCRelatedUserList
              channelId={profile.channelId}
              amount={5}
              skip={0}
            />
          </Grid>

          <Grid item md={4}>
            <Grid container spacing={2}>
              <Grid item sm={12}>
                <StatsCard
                  header={t('statistics:total_recommendations')}
                  count={recommendations.total}
                />
              </Grid>
              <Grid item sm={12}>
                <StatsCard
                  header={t('statistics:total_views')}
                  count={recommendations.totalViews}
                />
              </Grid>
              <Grid item sm={12}>
                <StatsCard
                  icon={<CommunityIcon />}
                  header={t('statistics:evidences_title')}
                  count={3}
                  color={theme.palette.success.main}
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

export const StatisticsPage = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile, creatorStats }) => {
      return (
        <Grid container spacing={3}>
          <Grid item md={12}>
            <CreatorStatsPage profile={profile} stats={creatorStats} />
          </Grid>
        </Grid>
      );
    })
  );
});
