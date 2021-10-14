import { getAuth } from '../../state/public.queries';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import { ErrorBox } from '../../components/common/ErrorBox';
import { LazyFullSizeLoader } from '../../components/common/FullSizeLoader';
import React from 'react';
import { LinkAccount } from './LinkAccount';

export const AuthBox: React.FC = ({ children }) => {
  return (
    <WithQueries
      queries={{ auth: getAuth }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ auth }) => {
        if (auth === undefined || !auth.verified) {
          return <LinkAccount auth={auth} />;
        }

        return children;
      })}
    />
  );
};
