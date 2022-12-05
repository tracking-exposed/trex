import tkHub from '../hub';
import * as React from 'react';
import { Snackbar } from '@material-ui/core';
import _ from 'lodash';
import { act } from 'react-dom/test-utils';

export const SigiStateSnackbar: React.FC = () => {
  // const [show, setShow] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);

  React.useEffect(() => {
    tkHub.on(
      'SigiState',
      _.debounce((e) => {
        const payload: any = e.payload;
        act(() => {
          setData([...data, payload]);
        });
      }, 400),
    );
  }, [data]);

  const handleDump = (): void => {
    void navigator.clipboard.writeText(JSON.stringify(data));
  };

  const message = (
    <div>
      SIGI State caught:
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
      open={data.length >= 1}
      onClose={() => {
        setData([]);
      }}
      message={message}
      key={'sigi-state'}
    />
  );
};
