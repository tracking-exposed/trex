import * as React from 'react';
import { v4 as uuid } from 'uuid';
import ErrorModal from '../../components/ErrorModal';
import { appErrorDetailsToString } from '../../errors/AppError';
import { Hub } from '../hub';
import HubEvent from '../models/HubEvent';

interface ErrorSnackbarsProps {
  hub: Hub<HubEvent>;
}
export const ErrorSnackbars: React.FC<ErrorSnackbarsProps> = ({ hub }) => {
  // const [show, setShow] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);

  const updateData = (d: any): void => {
    setData((data) => [...data, d]);
  };

  React.useEffect(() => {
    hub.on('ErrorEvent', (e) => {
      if (e.payload) {
        updateData({ ...e.payload, id: uuid() });
      }
    });

    return () => {};
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        minHeight: data.length > 0 ? 200 : 0,
        width: data.length > 0 ? 500 : 0,
        zIndex: 9900,
        boxSizing: 'content-box',
      }}
    >
      <div>
        {data.map((d, i) => {
          const details = appErrorDetailsToString(d);
          return (
            <ErrorModal
              key={d.id}
              name={d.name}
              message={d.message}
              details={details}
              style={{ position: 'relative', marginBottom: 20 }}
              onClick={() => {
                setData((data) => data.filter((dd) => dd.id !== d.id));
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
