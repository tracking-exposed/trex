import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import CommunityIcon from '@material-ui/icons/GroupOutlined';
import NotificationIcon from '@material-ui/icons/NotificationImportantOutlined';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatsCard } from '../../common/StatsCard';
import { CCRelatedUserList } from './CCRelatedUserList';
import { auth } from '../../../state/creator.queries';
import { LinkAccountButton } from 'components/common/LinkAccountButton';
import { AuthResponse } from '@backend/models/Auth';

interface CreatorStatsProps {
  auth?: AuthResponse;
}
const CreatorStats: React.FC<CreatorStatsProps> = ({ auth }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Grid item md={12}>
      {auth === undefined || !auth.verified ? (
        <LinkAccountButton />
      ) : (
        <Grid container>
          <Grid item md={6}>
            <Typography variant="h5" color="primary">
              {t('statistics:top_n_cc_related_to_your_channel', {
                count: 5,
              })}
            </Typography>
            <CCRelatedUserList channelId={auth.channelId} amount={5} skip={0} />
          </Grid>

          <Grid item md={6}>
            <StatsCard
              header={t('recommendations:title')}
              count={299}
              color={theme.palette.primary.main}
            />
            <Grid container spacing={2}>
              <Grid item sm={6}>
                <StatsCard
                  header={t('statistics:unique_watchers')}
                  count={16}
                />
              </Grid>
              <Grid item sm={6}>
                <StatsCard
                  icon={<CommunityIcon />}
                  header={t('statistics:evidences_title')}
                  count={3}
                  color={theme.palette.success.main}
                />
              </Grid>
            </Grid>

            <Grid item md={2}>
              <Card>
                <CardHeader
                  title={t('statistics:recommendability_score_title')}
                  subheader={t('statistics:recommendability_score_subtitle')}
                />
                <CardContent>30%</CardContent>
              </Card>
              <StatsCard
                icon={<NotificationIcon />}
                header={t('statistics:notifications_title')}
                count={3}
                color={theme.palette.error.main}
              />
            </Grid>
          </Grid>

          <Grid item md={12}>
            <Typography variant="h5">
              {t('statistics:advertising_connected_to_your_videos')}
            </Typography>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

const withQueries = declareQueries({ auth });

export const StatisticsPage = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ auth }) => {
      return (
        <Grid container spacing={3}>
          <Grid item md={12}>
            <CreatorStats auth={auth} />
          </Grid>
        </Grid>
      );
    })
  );
});
