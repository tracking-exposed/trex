import React from 'react';
import { WithQueries } from 'avenger/lib/react';
import * as QR from 'avenger/lib/QueryResult';

import { Card, CardContent, CardMedia, Typography } from '@material-ui/core';

import { ErrorBox } from '../common/ErrorBox';
import {
  getYTMaxResThumbnailById,
} from '../../utils/yt.utils';
import { LazyFullSizeLoader } from './FullSizeLoader';
import { oneCreatorVideo } from 'state/creator.queries';

interface YTVideoProps {
  videoId: string;
}

export const YTVideo: React.FC<YTVideoProps> = ({ videoId }) => (
  <WithQueries
    queries={{ oneCreatorVideo }}
    params={{ oneCreatorVideo: { params: { videoId } } }}
    render={QR.fold(
      LazyFullSizeLoader,
      ErrorBox,
      ({ oneCreatorVideo: video }) => (
        <Card>
          <CardMedia
            component="img"
            src={getYTMaxResThumbnailById(videoId)}
            title={video.title}
          />
          <CardContent>
            <Typography color="textSecondary" variant="subtitle2">
              {video.title}
            </Typography>
          </CardContent>
        </Card>
      )
    )}
  />
);
