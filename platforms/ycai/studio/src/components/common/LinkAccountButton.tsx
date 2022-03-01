import { Button } from '@material-ui/core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { doUpdateCurrentView } from '../../utils/location.utils';



export const LinkAccountButton: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Button
      onClick={() =>
        doUpdateCurrentView({
          view: 'linkAccount',
        })()
      }
    >
      {t('link_account:title')}
    </Button>
  );
};
