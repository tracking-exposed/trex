import * as React from 'react';
import _ from 'lodash';
import { Hub } from '../hub';
import HubEvent from '../models/HubEvent';
import ErrorModal from '../../components/ErrorModal';
import { appErrorDetailsToString } from '../../errors/AppError';

interface ErrorSnackbarsProps {
  hub: Hub<HubEvent>;
}
export const ErrorSnackbars: React.FC<ErrorSnackbarsProps> = ({ hub }) => {
  // const [show, setShow] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);

  React.useEffect(() => {
    hub.on(
      'ErrorEvent',
      _.debounce((e) => {
        setData([...data, e.payload]);
      }, 400)
    );
  }, [data]);

  console.log('errors snackbars', data);

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        minHeight: 200,
        width: 500,
        zIndex: 9900,
        boxSizing: 'content-box',
      }}
    >
      {data.map((d, i) => {
        const details = appErrorDetailsToString(d);
        return (
          <ErrorModal
            name={d.name}
            message={d.message}
            details={details}
            onClick={() => {
              const head = data.slice(0, i);
              const tail =
                i === data.length - 1 ? [] : data.slice(i + 1, data.length);

              setData([...head, ...tail]);
            }}
          />
        );
      })}
    </div>
  );
};
