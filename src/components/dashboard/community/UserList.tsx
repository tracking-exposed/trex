import { ContentCreator } from '@backend/models/ContentCreator';
import { Avatar, List, ListItem, Typography } from '@material-ui/core';
import * as React from 'react';

interface UserListProps {
  users: ContentCreator[];
  onUserClick: (u: ContentCreator) => void;
}

export const UserList: React.FC<UserListProps> = ({ users }) => {
  return (
    <List>
      {users.map((u, i) => (
        <ListItem key={u.channelId}>
          <Avatar src={u.avatar} />
          <Typography>{u.username}</Typography>
        </ListItem>
      ))}
    </List>
  );
};
