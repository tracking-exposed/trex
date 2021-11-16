import React from 'react';
import { WithQueries } from 'avenger/lib/react';
import * as QR from 'avenger/lib/QueryResult';

import {
  Card,
  CardContent,
  CardMedia,
  Link,
} from '@material-ui/core';

import { ErrorBox } from '../common/ErrorBox';
import {
  getYTMaxResThumbnailById,
  getYTVideoURLById,
} from '../../utils/yt.utils';
import { LazyFullSizeLoader } from './FullSizeLoader';
import { oneCreatorVideo } from 'state/creator.queries';

interface YTVideoProps {
  videoId: string;
}

export const YTVideo: React.FC<YTVideoProps> = ({ videoId }) =>
  <WithQueries
    queries={{ oneCreatorVideo }}
    params={{ oneCreatorVideo: { params: { videoId } } }}
    render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ oneCreatorVideo: video }) => (
      <Card>
        <CardMedia
            component="img"
            src={getYTMaxResThumbnailById(videoId)}
            title={video.title}
        />
        <CardContent>
          <Link
            color="textPrimary"
            href={getYTVideoURLById(videoId)}
            rel="noreferrer"
            target="_blank"
            underline="none"
            variant="subtitle1"
          >
            {video.title}
          </Link>
        </CardContent>
      </Card>
    ))}
  />
