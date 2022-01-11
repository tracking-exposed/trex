import * as React from 'react';
import { Box, FormControlLabel, Input } from '@material-ui/core';

const makeTextInput =
  ({ label, key }: { label: string; key: string }) =>
  // eslint-disable-next-line react/display-name
  (params: any, setParams: React.Dispatch<any>): JSX.Element => {
    return (
      <Box margin={2}>
        <FormControlLabel
          style={{
            alignItems: 'flex-start',
          }}
          labelPlacement="top"
          label={label}
          inputMode="text"
          control={
            <Input
              name={key}
              value={params[key] ?? ''}
              onChange={(e) => setParams({ ...params, [key]: e.target.value })}
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
  label: 'Public Key',
  key: 'publicKey',
});
export const experimentIdInput = makeTextInput({
  label: 'Experiment ID',
  key: 'experimentId',
});
