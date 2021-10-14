import {
  Box,
  Button,
  FormControl,
  TextField,
  Typography,
} from '@material-ui/core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { addRecommendation } from '../../state/creator.commands';

const AddRecommendationBox: React.FC = () => {
  const { t } = useTranslation();
  const [recommendation, setRecommendation] = React.useState('');
  const onAddClick = React.useCallback(
    async (e): Promise<void> => {
      if (recommendation !== undefined) {
        await addRecommendation({ url: recommendation })();
        setRecommendation('');
      }
    },
    [recommendation]
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      style={{
        width: '100%',
        textAlign: 'left',
      }}
    >
      <Typography variant="h5" color="secondary">
        {t('recommendations:add_to_video')}
      </Typography>
      <FormControl
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
        <TextField
          label={t('recommendations:url')}
          placeholder={t('recommendations:url_placeholder')}
          helperText={t('recommendations:url_helper_text')}
          multiline
          value={recommendation}
          onChange={(v) => setRecommendation(v.target.value)}
          color="secondary"
        />
        <Button variant="contained" color="secondary" onClick={onAddClick}>
          {t('actions:add')}
        </Button>
      </FormControl>
    </Box>
  );
};

export default AddRecommendationBox;
