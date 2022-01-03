import {
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
} from '@material-ui/core';
import { isValidationError } from '@shared/errors/ValidationError';
import * as React from 'react';

export const ErrorOverlay: React.FC<Error> = (error) => {
  const theme = useTheme();
  return (
    <Box
      display={'flex'}
      alignContent={'center'}
      width={'100%'}
      alignSelf={'center'}
      alignItems={'center'}
      style={{
        height: '100%',
      }}
    >
      <Box
        style={{
          textAlign: 'center',
          margin: 'auto',
        }}
      >
        <Card variant="outlined">
          <CardHeader
            title={error.name}
            subheader={error.message}
            color={theme.palette.error.main}
          />
          <CardContent>
            <Typography variant="h6">Details</Typography>
            {isValidationError(error) ? (
              <List>
                {error.details.map((d) => (
                  <ListItem key={d}>
                    <ListItemText>{d}</ListItemText>
                  </ListItem>
                ))}
              </List>
            ) : null}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
