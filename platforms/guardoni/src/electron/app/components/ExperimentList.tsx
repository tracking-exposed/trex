import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  List,
  ListItem,
  makeStyles,
  Typography,
  useTheme,
} from '@material-ui/core';
import * as t from 'io-ts';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LinkIcon from '@material-ui/icons/LinkOutlined';
import { GuardoniExperiment } from '@shared/models/Experiment';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { RouteProps, useHistory } from 'react-router';
import { PlatformConfig } from '../../../guardoni/types';
import { EVENTS } from '../../models/events';

const useStyle = makeStyles((theme) => ({
  directiveRow: {
    cursor: 'pointer',
    border: 'solid #23AA9A 2px',
    marginBottom: 10,
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
    marginBottom: 20,
  },
  directiveLinkListItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailsActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  const theme = useTheme();

  const classes = useStyle();

  return (
    <List>
      {experiments.map((d, i) => {
        const isSelected = d.experimentId === directiveId;
        return (
          <Accordion
            elevation={0}
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
              <Typography
                variant="body1"
                style={{ marginLeft: theme.spacing(1) }}
              >
                {d.tags.join(', ')}
              </Typography>
              <Box
                style={{
                  display: 'flex',
                  flexGrow: 1,
                  flexShrink: 0,
                  justifyContent: 'flex-end',
                  marginRight: 20,
                  alignItems: 'center',
                }}
              >
                <LinkIcon />
                <Typography variant="subtitle2">- {d.links.length}</Typography>
              </Box>

              <Typography
                variant="caption"
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  justifyContent: 'flex-end',
                }}
                color="primary"
              >
                {formatDistanceToNow(parseISO(d.when))}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <Typography variant="h5" style={{ marginLeft: 14.5 }}>
                URLs
              </Typography>
              <List className={classes.directiveLinkList}>
                {d.links.map((l) => (
                  <ListItem
                    className={classes.directiveLinkListItem}
                    key={l.url}
                  >
                    <Typography variant="h6" color="primary">
                      {l.urltag} ({l.watchFor ?? 'end'}):
                    </Typography>{' '}
                    <Typography variant="body2">{l.url}</Typography>
                  </ListItem>
                ))}
              </List>
              <Box className={classes.detailsActions}>
                <Box style={{ marginRight: 30 }}>
                  <Typography color="primary" variant="h6">
                    Estimated Runtime: {d.time / 1000} s
                  </Typography>
                </Box>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => onExperimentRunClick(d)}
                >
                  LOAD
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
  RouteProps & { config: PlatformConfig }
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

    return () => {
      ipcRenderer.removeAllListeners(EVENTS.GET_PUBLIC_DIRECTIVES.value);
    };
  }, [config]);

  const experimentsWithTags = React.useMemo(
    () =>
      experiments.reduce<GuardoniExperimentWithTags[]>((acc, e) => {
        const { tags, time } = e.links.reduce(
          (accL, l) => {
            const time = t.number.is(l.watchFor)
              ? l.watchFor
              : l.watchFor === 'end'
              ? 60000
              : 0;
            return {
              tags: accL.tags.concat(l.urltag),
              time: accL.time + time,
            };
          },
          {
            tags: [] as string[],
            time: 0,
          }
        );

        return acc.concat({ ...e, tags, time });
      }, []),
    [experiments]
  );

  if (experimentsWithTags.length === 0) {
    return (
      <Grid container style={{ justifyContent: 'center' }}>
        <Grid item md={8}>
          <Box pt={3} pb={2}>
            <Typography variant="h4">No Available Experiments</Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box
      style={{
        padding: theme.spacing(2),
      }}
    >
      <Grid container style={{ justifyContent: 'center' }}>
        <Grid item md={8}>
          <Box pt={3} pb={2}>
            <Typography variant="h4">Available Experiments</Typography>
          </Box>
          <ExperimentList
            experiments={experimentsWithTags}
            onExperimentRunClick={(e) => runGuardoni(e.experimentId)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExperimentListRoute;
