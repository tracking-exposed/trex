import { WithQueries } from 'avenger/lib/react';
import React from 'react';
import { creatorVideos } from '../API/queries';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from './common/FullSizeLoader';
import { ErrorBox } from './common/ErrorBox';
import { VideoCard } from './VideoCard';
import { setCurrentVideo } from '../API/commands';

export class CreatorVideos extends React.PureComponent {
  render () {
    return (
      <WithQueries
        queries={{ videos: creatorVideos }}
        params={{}}
        render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ videos }) => {
          return videos.map((v, i) => (
            <VideoCard
              key={i}
              id={v.videoId}
              title={v.title}
              onClick={() => {
                setCurrentVideo(v, {})();
              }}
            />
          ));
        })}
      />
    );
  }
}
