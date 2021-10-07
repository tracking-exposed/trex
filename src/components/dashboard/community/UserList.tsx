import { Avatar, List, ListItem, Typography } from '@material-ui/core';
import * as React from 'react';

interface User {
  id: string;
  username: string;
  avatar: string;
}

interface UserListProps {
  users: User[];
  onUserClick: (u: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ users }) => {
  return (
    <List>
      {users.map((u, i) => (
        <ListItem key={u.id}>
          <Avatar src={u.avatar} />
          <Typography>{u.username}</Typography>
        </ListItem>
      ))}
    </List>
  );
};
