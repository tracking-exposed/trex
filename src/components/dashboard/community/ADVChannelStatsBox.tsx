import { Link, List, ListItem, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import { ErrorBox } from 'components/common/ErrorBox';
import { LazyFullSizeLoader } from 'components/common/FullSizeLoader';
import * as React from 'react';
import { creatorADVStats } from 'state/creator.queries';

export const ADVChannelStatsBox: React.FC = () => {
  return (
    <WithQueries
      queries={{
        creatorADVStats: creatorADVStats,
      }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ creatorADVStats }) => {
        return (
          <List disablePadding={true}>
            {creatorADVStats.map((adv, i) => (
              <ListItem
                key={adv.href}
                style={{ flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Typography
                  variant="h3"
                  style={{ marginBottom: 10 }}
                  color="primary"
                >
                  {adv.sponsoredName}
                </Typography>
                <Link variant="subtitle1" href={`https://${adv.sponsoredSite}`}>
                  {adv.sponsoredSite}
                </Link>
              </ListItem>
            ))}
          </List>
        );
      })}
    />
  );
};
