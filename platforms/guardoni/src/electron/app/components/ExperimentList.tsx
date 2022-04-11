import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  List,
  ListItem,
  makeStyles,
  Typography,
  useTheme,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LinkIcon from '@material-ui/icons/LinkOutlined';
import { GuardoniExperiment } from '@shared/models/Experiment';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { RouteProps, useHistory } from 'react-router';
import { GuardoniConfig } from '../../../guardoni/types';
import { EVENTS } from '../../models/events';

const useStyle = makeStyles((theme) => ({
  directiveRow: {
    cursor: 'pointer',
  },
  directiveRowSelected: {
    boxShadow: theme.shadows[3],
  },
  listItemSummary: {
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
  },
  directiveLinkList: {
    marginBottom: 30,
  },
  detailsActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
}));

type GuardoniExperimentWithTags = GuardoniExperiment & {
  tags: string[];
  time: any;
};
interface ExperimentListProps {
  experiments: GuardoniExperimentWithTags[];
  onExperimentRunClick: (e: GuardoniExperimentWithTags) => void;
}

export const ExperimentList: React.FC<ExperimentListProps> = ({
  experiments,
  onExperimentRunClick,
}) => {
  const [directiveId, setDirectiveId] = React.useState<string | undefined>(
    undefined
  );

  const classes = useStyle();

  return (
    <List>
      {experiments.map((d, i) => {
        const isSelected = d.experimentId === directiveId;
        return (
          <Accordion
            key={d.experimentId}
            className={`${classes.directiveRow} ${
              isSelected ? classes.directiveRowSelected : ''
            }`}
            onClick={() => setDirectiveId(d.experimentId)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              classes={{
                content: classes.listItemSummary,
              }}
            >
              <LinkIcon />
              <Typography variant="subtitle2" style={{ marginRight: 10 }}>
                {d.links.length}
              </Typography>
              <Typography variant="subtitle1">{d.tags.join(', ')}</Typography>
              <Typography
                variant="caption"
                style={{
                  display: 'flex',
                  flexGrow: 1,
                  justifyContent: 'flex-end',
                }}
              >
                {formatDistanceToNow(parseISO(d.when))}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
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
              <Box className={classes.detailsActions}>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => onExperimentRunClick(d)}
                >
                  Run
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </List>
  );
};

const ExperimentListRoute: React.FC<
  RouteProps & { config: GuardoniConfig }
> = ({ config }) => {
  const theme = useTheme();
  const [experiments, setDirectives] = React.useState<GuardoniExperiment[]>([]);

  const history = useHistory();

  const runGuardoni = React.useCallback((experimentId: string) => {
    history.push(`/run/${experimentId}`);
  }, []);

  React.useEffect(() => {
    ipcRenderer.on(EVENTS.GET_PUBLIC_DIRECTIVES.value, (event, ...args) => {
      const [directives] = args;
      setDirectives(directives);
    });

    ipcRenderer.send(EVENTS.GET_PUBLIC_DIRECTIVES.value);
  }, []);

  if (experiments.length === 0) {
    return <Typography>No experiment available</Typography>;
  }

  const experimentsWithTags = experiments.reduce<GuardoniExperimentWithTags[]>(
    (acc, e) => {
      const { tags, time } = e.links.reduce(
        (accL, l) => {
          return {
            tags: accL.tags.concat(l.urltag),
            time: l.watchFor ? accL.time.concat(l.watchFor + '') : accL.time,
          };
        },
        {
          tags: [] as string[],
          time: '',
        }
      );

      return acc.concat({ ...e, tags, time } );
    },
    []
  );

  return (
    <Box
      style={{
        padding: theme.spacing(2),
      }}
    >
      <ExperimentList
        experiments={experimentsWithTags}
        onExperimentRunClick={(e) => runGuardoni(e.experimentId)}
      />
    </Box>
  );
};

export default ExperimentListRoute;
