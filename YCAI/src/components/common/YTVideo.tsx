import { Card, CardContent, CardMedia, Link, } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import React from 'react';
import { oneCreatorVideo } from '../../state/dashboard/creator.queries';
import {
  getYTMaxResThumbnailById,
  getYTVideoURLById,
} from '../../utils/yt.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from './FullSizeLoader';

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
        <Card style={{boxShadow: "none", backgroundColor: 'transparent',}}>
          <CardMedia
            component="img"
            src={getYTMaxResThumbnailById(videoId)}
            title={video.title}
            style={{borderRadius: "8px",}}
          />
          <CardContent style={{paddingLeft: '0px', paddingTop: '10px', paddingBottom: '0px'}}>
            <Link
              color="textSecondary"
              variant="h5"
              href={getYTVideoURLById(videoId)}
              rel="noreferrer"
              target="_blank"
              underline="none"
            >
              {video.title}
            </Link>
          </CardContent>
        </Card>
      )
    )}
  />
);

