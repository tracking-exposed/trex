import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  Input, Typography
} from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { registerCreatorChannel } from '../../API/commands';

export const LinkAccount: React.FC = () => {
  const { t } = useTranslation();

  const [channel, setChannel] = React.useState<string>('');

  const inputRef = React.useRef<HTMLInputElement>(null);

  const onSubmit: React.KeyboardEventHandler<HTMLInputElement> = async (
    e
  ): Promise<void> => {
    // this handle the pressing of "Enter" key
    if (e.keyCode === 13) {
      await registerCreatorChannel(e.currentTarget.value, {
        ccRelatedUsers: { channelId: e.currentTarget.value, amount: 5 },
      })();
    }
  };

  const handleChannelSubmit: React.MouseEventHandler<HTMLButtonElement> =
    async () => {
      if (inputRef.current?.firstChild !== null) {
        const channelId = (inputRef.current?.firstChild as any).value;
        await registerCreatorChannel(channelId, {
          ccRelatedUsers: { channelId, amount: 5 },
        })();
      }
    };

  const creatorChannelValue = channel ?? '';

  return (
    <Box display="flex" flexDirection="column">
      <Typography color="secondary" variant="subtitle1">
        {t('link_account:label')}
      </Typography>
      <FormControl>
        <InputLabel htmlFor="creator-channel">
          {t('account:channel')}
        </InputLabel>
        <Input
          id="creator-channel"
          ref={inputRef}
          fullWidth={true}
          value={creatorChannelValue}
          onChange={(e) => setChannel(e.target.value)}
          onKeyDown={onSubmit}
        />
        <ButtonGroup style={{ marginTop: 10 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleChannelSubmit}
          >
            {t('actions:link_channel')}
          </Button>
        </ButtonGroup>
      </FormControl>
    </Box>
  );
};
