import * as React from 'react';
import { Box, FormControlLabel, Input } from '@material-ui/core';

const makeTextInput =
  ({ label, key }: { label: string; key: string }) =>
  // eslint-disable-next-line react/display-name
  (params: any, setParams: React.Dispatch<any>): JSX.Element => {
    return (
      <Box>
        <FormControlLabel
          style={{
            alignItems: 'flex-start',
            marginLeft: 0,
            width: '100%',
          }}
          labelPlacement="top"
          label={label}
          inputMode="text"
          control={
            <Input
              name={key}
              value={params[key] ?? ''}
              onChange={(e) => setParams({ ...params, [key]: e.target.value })}
              style={{
                width: '30%',
              }}
            />
          }
        />
      </Box>
    );
  };

export const channelIdInput = makeTextInput({
  label: 'Channel ID',
  key: 'channelId',
});
export const publicKeyInput = makeTextInput({
  label: 'Public Key:',
  key: 'publicKey',
});
export const experimentIdInput = makeTextInput({
  label: 'Experiment ID',
  key: 'experimentId',
});
