import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ccRelatedUsers } from '../../../state/dashboard/creator.queries';
import { EmptyList } from '../../common/EmptyList';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import { UserList } from './UserList';

interface CCRelatedUserListProps {
  channelId: string;
  amount: number;
  skip: number;
}

export const CCRelatedUserList: React.FC<CCRelatedUserListProps> = ({
  amount,
  skip,
}) => {
  const { t } = useTranslation();

  return (
    <WithQueries
      queries={{ ccRelatedUsers }}
      params={{ ccRelatedUsers: { params: { amount, skip } } }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ ccRelatedUsers }) => {
        if (ccRelatedUsers.length === 0) {
          return <EmptyList resource={t('creator:title')} />;
        }
        return (
          <UserList
            users={ccRelatedUsers}
            onUserClick={() => {
              alert('clicked');
            }}
          />
        );
      })}
    />
  );
};
