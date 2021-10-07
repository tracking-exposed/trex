import { pipe } from 'fp-ts/lib/pipeable';
import * as React from 'react';
import * as QR from 'avenger/lib/QueryResult';
import { useQueries } from 'avenger/lib/react';
import { ccRelatedUsers } from '../../../API/queries';
import { LazyFullSizeLoader } from 'components/common/FullSizeLoader';
import { ErrorBox } from 'components/common/ErrorBox';
import { UserList } from './UserList';

interface CCRelatedUserListProps {
  channelId: string;
  amount: number;
}

export const CCRelatedUserList: React.FC<CCRelatedUserListProps> = ({
  channelId,
  amount,
}) => {
  const queries = useQueries(
    { ccRelatedUsers },
    { ccRelatedUsers: { channelId, amount } }
  );
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ ccRelatedUsers }) => {
      return (
        <UserList
          users={ccRelatedUsers}
          onUserClick={() => {
            alert('clicked');
          }}
        />
      );
    })
  );
};
