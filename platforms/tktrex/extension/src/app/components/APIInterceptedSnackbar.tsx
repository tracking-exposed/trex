import Snackbar from '@mui/material/Snackbar';
import tkHub from '../hub';
import _ from 'lodash';
import * as React from 'react';

export const APIInterceptedSnackbar: React.FC = () => {
  // const [show, setShow] = React.useState(false);
  const [data, setData] = React.useState<{ intercepted: any[] }>({
    intercepted: [],
  });

  React.useEffect(() => {
    tkHub.on(
      'APIRequestEvent',
      _.debounce((e) => {
        const payload: any = e.payload;
        if (!data.intercepted.some((ee) => ee.id === payload.id)) {
          setData({ intercepted: [...data.intercepted, payload] });
        }
      }, 400),
    );
  }, [data.intercepted]);

  const handleDump = (): void => {
    void navigator.clipboard.writeText(JSON.stringify(data));
  };

  const message = (
    <div>
      API intercepted {data.intercepted.length}:
      <br />
      Click{' '}
      <a onClick={handleDump} style={{ color: 'green' }}>
        here
      </a>{' '}
      to download a dump.
    </div>
  );

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      open={data.intercepted.length >= 1}
      onClose={() => {
        setData({ intercepted: [] });
      }}
      message={message}
      key={'api-intercepted'}
      style={{
        bottom: 110,
      }}
    />
  );
};
