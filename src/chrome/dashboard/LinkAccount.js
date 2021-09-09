import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import UrlCard from './UrlCard';
import {
  deleteCreatorChannel,
  saveCreatorChannel,
  setCreatorChannel,
} from './API/commands';
import { useQueries, WithQueries } from 'avenger/lib/react';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from './components/common/FullSizeLoader';
import { ErrorBox } from './components/common/ErrorBox';
import * as queries from './API/queries';
import {
  Button,
  FormControl,
  Grid,
  Input,
  Typography,
} from '@material-ui/core';
import { CreatorVideos } from './components/CreatorVideos';
import { pipe } from 'fp-ts/lib/function';

export const LinkAccount = () => {
  const [channel, setChannel] = React.useState(undefined);

  const inputRef = React.useRef(null);

  const handleChange = (e) => {
    const channelValue = e.target.value;
    console.log('on change', channelValue);
    setChannel(channelValue || "");
  };

  const onSubmit = (e) => {
    // this handle the pressing of "Enter" key
    if (e.keyCode === 13) {
      saveCreatorChannel(e.target.value)();
    }
  };

  const handleChannelSubmit = () => {
    const channelId = inputRef.current.lastChild.value;
    console.log({ channelId });
    if (channelId) {
      saveCreatorChannel(channelId, { recommendations: {}, currentVideoOnEdit: {}})();
    }
  };

  const handleChannelDelete = () => {
    setChannel(undefined);
    deleteCreatorChannel()();
  };

  return pipe(
    useQueries({ creatorChannel: queries.creatorChannel }),
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ creatorChannel }) => {
      console.log({ channel, creatorChannel });
      const creatorChannelValue = channel !== undefined ? channel : creatorChannel.publicKey;

      return (
        <Grid container>
          <Grid item md={4}>
            <FormControl>
              <InputLabel htmlFor="creator-channel">
                Your Channel name (uno, due)
              </InputLabel>
              <Input
                id="creator-channel"
                ref={inputRef}
                fullWidth={true}
                value={creatorChannelValue || ''}
                onChange={handleChange}
                onKeyDown={onSubmit}
              />
              <Button
                variant="contained"
                color="secondary"
                disabled={!creatorChannelValue}
                onClick={() => handleChannelDelete()}
              >
                Delete
              </Button>

              <Button
                variant="contained"
                color="primary"
                disabled={!creatorChannelValue}
                onClick={handleChannelSubmit}
              >
                Import videos
              </Button>
            </FormControl>
          </Grid>
          <Grid item md={4}>
            <Typography>Channel videos</Typography>
            <CreatorVideos />
          </Grid>
        </Grid>
      );
    })
  );
};
