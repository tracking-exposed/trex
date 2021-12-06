import { auth, localProfile } from '../../state/dashboard/creator.queries';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import { ErrorBox } from '../../components/common/ErrorBox';
import { LazyFullSizeLoader } from '../../components/common/FullSizeLoader';
import React from 'react';
import { LinkAccount } from './LinkAccount';

export const AuthBox: React.FC = ({ children }) => {
  return (
    <WithQueries
      queries={{ profile: localProfile, auth }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile, auth }) => {
        if (auth?.verified !== true) {
          return <LinkAccount auth={auth} />;
        }

        return children;
      })}
    />
  );
};
