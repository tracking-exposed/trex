import { Box, Typography } from '@material-ui/core';
import { videoRecommendations } from 'API/queries';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { VideoCard } from 'components/dashboard/VideoCard';
import { pipe } from 'fp-ts/lib/function';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';

const withQueries = declareQueries({ videoRecommendations });

export const Recommendations = withQueries(
  ({ queries }): React.ReactElement => {
    const { t } = useTranslation();
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ videoRecommendations }) => {
        return (
          <Box>
            <Typography variant="h5">
              {t('recommendations:title')} {videoRecommendations.length}
            </Typography>
            {videoRecommendations.map((r, i) => (
              <VideoCard key={i} {...r} />
            ))}
          </Box>
        );
      })
    );
  }
);
