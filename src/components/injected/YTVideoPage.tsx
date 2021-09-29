import { AppBar, Box, Tabs, Typography } from '@material-ui/core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getVideoId } from 'utils/yt.utils';
import { Tab } from '../common/Tab';
import { VideoRecommendations } from '../dashboard/VideoRecommendations';

export const YTVideoPage: React.FC = () => {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(0);
  const videoId = React.useMemo(
    () => getVideoId(window.location.href),
    [window.location.href]
  );

  return (
    <Box>
      {videoId === undefined ? (
        <Typography variant="h3">{t('videos:no_video_id')}</Typography>
      ) : (
        <Box>
          <AppBar position="static">
            <Tabs
              value={value}
              onChange={(e, n) => setValue(n)}
              aria-label="simple tabs example"
            >
              <Tab label={t('ytVideoPage:firstTab')} index={0} />
              <Tab label={t('ytVideoPage:secondTab')} index={1} />
              <Tab label={t('ytVideoPage:thirdTab')} index={2} />
            </Tabs>
          </AppBar>
          <VideoRecommendations
            queries={{ videoRecommendations: { videoId } }}
          />
        </Box>
      )}
    </Box>
  );
};
