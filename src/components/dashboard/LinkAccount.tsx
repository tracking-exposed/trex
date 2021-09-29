import {
  Button,
  FormControl,
  Grid,
  Input,
  Typography,
} from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { registerCreatorChannel, updateSettings } from '../../API/commands';
import * as queries from '../../API/queries';
import { ErrorBox } from '../../components/common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { CreatorVideos } from './CreatorVideos';

const withQueries = declareQueries({
  accountSettings: queries.accountSettings,
});

export const LinkAccount = withQueries(({ queries }) => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ accountSettings }) => {
      const [channel, setChannel] = React.useState<string | null>(
        accountSettings.channelCreatorId
      );

      const inputRef = React.useRef<HTMLInputElement>(null);

      const onSubmit: React.KeyboardEventHandler<HTMLInputElement> = async (
        e
      ): Promise<void> => {
        // this handle the pressing of "Enter" key
        if (e.keyCode === 13) {
          await registerCreatorChannel(e.currentTarget.value)();
          // await updateSettings({
          //   ...accountSettings,
          //   edit: {
          //     title: "Default title",
          //     recommendations: [],
          //     ...accountSettings.edit,
          //     videoId: e.currentTarget.value,
          //   },
          // })();
        }
      };

      const handleChannelSubmit: React.MouseEventHandler<HTMLButtonElement> =
        async () => {
          if (inputRef.current?.lastChild !== null) {
            await registerCreatorChannel(
              (inputRef.current?.lastChild as any).value
            )();
          }
        };

      const handleChannelDelete = async (): Promise<void> => {
        setChannel(null);
        await updateSettings({
          ...accountSettings,
          channelCreatorId: null,
        })();
      };

      const creatorChannelValue = channel ?? '';

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
                value={creatorChannelValue}
                onChange={(e) => setChannel(e.target.value)}
                onKeyDown={onSubmit}
              />
              <Button
                variant="contained"
                color="secondary"
                disabled={creatorChannelValue === ''}
                onClick={() => handleChannelDelete()}
              >
                Delete
              </Button>

              <Button
                variant="contained"
                color="primary"
                disabled={creatorChannelValue === ''}
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
});
