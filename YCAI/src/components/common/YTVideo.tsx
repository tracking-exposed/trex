import { Card, CardContent, Link } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import React from 'react';
import { oneCreatorVideo } from '../../state/dashboard/creator.queries';
import {
  getYTVideoURLById,
  getYTEmbeddingURLById,
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
          <iframe
            sandbox="allow-scripts allow-same-origin"
            src={getYTEmbeddingURLById(videoId)}
            width="100%"
            height={315}
            style={{
              border: 'none',
            }}
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
