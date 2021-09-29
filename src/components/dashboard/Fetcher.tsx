import { Box, Button, TextField } from '@material-ui/core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { addRecommendation } from '../../API/commands';

const Fetcher: React.FC = () => {
  const { t } = useTranslation();
  const completed = React.useCallback(async (e): Promise<void> => {
    const url = document.querySelector<HTMLInputElement>(
      '[placeholder="Placeholder"]'
    )?.value;
    if (url !== undefined) {
      await addRecommendation({ url })();
    }
  }, []);

  return (
    <Box
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <TextField
        label={t('recommendations:url')}
        placeholder="Placeholder"
        multiline
      />
      <Button variant="contained" color="secondary" onClick={completed}>
        {t('actions:add')}
      </Button>
    </Box>
  );
};

export default Fetcher;
