import {
  Box,
  Button,
  FormHelperText,
  List,
  ListItem,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { GuardoniExperiment } from '@shared/models/Experiment';
import { formatDate } from '@shared/utils/date.utils';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { GET_PUBLIC_DIRECTIVES } from '../models/events';

const useStyle = makeStyles((theme) => ({
  directiveRow: {
    cursor: 'pointer',
  },
  directiveRowSelected: {
    boxShadow: theme.shadows[3],
  },
  directiveLinkList: {
    marginBottom: 30,
  },
}));
interface FromCSVFileTabProps {
  onSubmit: (experimentId: string) => void;
}

export const AutoRunTab: React.FC<FromCSVFileTabProps> = ({ onSubmit }) => {
  const classes = useStyle();
  const [directiveId, setDirectiveId] = React.useState<string | undefined>(
    undefined
  );
  const [directives, setDirectives] = React.useState<GuardoniExperiment[]>([]);

  React.useEffect(() => {
    ipcRenderer.on(GET_PUBLIC_DIRECTIVES.value, (event, ...args) => {
      const [directives] = args;
      setDirectives(directives);
    });

    ipcRenderer.send(GET_PUBLIC_DIRECTIVES.value);
  }, []);

  return (
    <Box display={'flex'} flexDirection={'column'}>
      {directives.map((d, i) => {
        const isSelected = d.experimentId === directiveId;
        return (
          <Box
            key={d.experimentId}
            className={`${classes.directiveRow} ${
              isSelected ? classes.directiveRowSelected : ''
            }`}
            onClick={() => setDirectiveId(d.experimentId)}
          >
            <Typography variant="h6">{d.experimentId}</Typography>
            <Typography variant="caption">
              {formatDate(new Date(d.when))}
            </Typography>
            <Box>
              <List className={classes.directiveLinkList}>
                {d.links.map((l) => (
                  <ListItem key={l.url}>
                    <Typography variant="subtitle1" color="primary">
                      {l.urltag} ({l.watchFor ?? 'end'}):
                    </Typography>{' '}
                    <Typography variant="body2">{l.url}</Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        );
      })}

      <Button
        color="primary"
        variant="contained"
        disabled={directiveId === undefined}
        style={{ marginBottom: 20, marginTop: 20 }}
        onClick={() => {
          if (directiveId) {
            void onSubmit(directiveId);
          }
        }}
      >
        Start guardoni ({directiveId})
      </Button>

      <FormHelperText>
        The value provided here refers to existing experiments:
        <br />
        1. Greta - Climate Change
        <br />
        2. Dunno
      </FormHelperText>
    </Box>
  );
};
