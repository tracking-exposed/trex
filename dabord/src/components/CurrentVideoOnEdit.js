import { WithQueries } from "avenger/lib/react";
import React from "react";
import { currentVideoOnEdit } from "../API/queries";
import * as QR from "avenger/lib/QueryResult";
import { LazyFullSizeLoader } from "./common/FullSizeLoader";
import { ErrorBox } from "./common/ErrorBox";
import { VideoCard } from "./VideoCard";
import { Box } from "@material-ui/core";
import { VideoRecommendations } from "./VideoRecommendations";

export class CurrentVideoOnEdit extends React.PureComponent {
  render() {
    return (
      <WithQueries
        queries={{ video: currentVideoOnEdit }}
        render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ video }) => {
          if (!video) {
            return "No video selected";
          }
          return (
            <Box>
              <VideoCard id={video.videoId} title={video.title} />
              <VideoRecommendations videoId={video.videoId} />
            </Box>
          );
        })}
      />
    );
  }
}
