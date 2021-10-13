import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import CommunityIcon from '@material-ui/icons/GroupOutlined';
import NotificationIcon from '@material-ui/icons/NotificationImportantOutlined';
import { settings } from 'API/queries';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatsCard } from '../../common/StatsCard';
import { LinkAccount } from '../LinkAccount';
import { CCRelatedUserList } from './CCRelatedUserList';

const withQueries = declareQueries({ accountSettings: settings });

export const CommunityPage = withQueries(
  ({ queries }): React.ReactElement => {
    const { t } = useTranslation();
    const theme = useTheme();

    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ accountSettings }) => {
        return (
          <Grid container spacing={3}>
            <Grid item md={4}>
              <Card>
                <CardHeader
                  title={t('community:recommendability_score_title')}
                  subheader={t('community:recommendability_score_subtitle')}
                />
                <CardContent>30%</CardContent>
              </Card>
            </Grid>
            <Grid item md={4}>
              {accountSettings.channelCreatorId === null ? (
                <LinkAccount />
              ) : (
                <Box>
                  <Typography variant="h5" color="primary">
                    {t('statistics:top_n_cc_related_to_your_channel', {
                      count: 5,
                    })}
                  </Typography>
                  <CCRelatedUserList
                    channelId={accountSettings.channelCreatorId}
                    amount={5}
                  />
                </Box>
              )}
            </Grid>
            <Grid item md={4}>
              <StatsCard
                header={t('recommendations:title')}
                count={299}
                color={theme.palette.primary.main}
              />
              <StatsCard header={t('statistics:unique_watchers')} count={16} />
              <Grid container spacing={3}>
                <Grid item sm={6}>
                  <StatsCard
                    icon={<CommunityIcon />}
                    header={t('statistics:evidences_title')}
                    count={3}
                    color={theme.palette.success.main}
                  />
                </Grid>
                <Grid item sm={6}>
                  <StatsCard
                    icon={<NotificationIcon />}
                    header={t('statistics:notifications_title')}
                    count={3}
                    color={theme.palette.error.main}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item md={12}>
              <Typography variant="h5">
                {t('statistics:advertising_connected_to_your_videos')}
              </Typography>
            </Grid>
          </Grid>
        );
      })
    );
  }
);
