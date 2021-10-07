import * as QR from 'avenger/lib/QueryResult';
import { useQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/pipeable';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ccRelatedUsers } from '../../../API/queries';
import { EmptyList } from '../../common/EmptyList';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
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
  const {t} = useTranslation();

  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ ccRelatedUsers }) => {
      if (ccRelatedUsers.length === 0) {
        return <EmptyList resource={t('creator:title')} />
      }
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
