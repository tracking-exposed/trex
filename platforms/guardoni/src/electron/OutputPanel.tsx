import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  makeStyles,
  Typography,
} from '@material-ui/core';
import * as React from 'react';
import { v4 as uuid } from 'uuid';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { AlertTitle } from '@material-ui/lab';

function Alert(props: AlertProps): JSX.Element {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const alertSeverity = (level: OutputItem['level']): AlertProps['severity'] => {
  if (level === 'Error') {
    return 'error';
  }
  return 'info';
};

const useStyles = makeStyles((theme) => ({
  accordion: {
    '& > .MuiAccordionSummary-root': {
      padding: 0,
      '& > .MuiAccordionSummary-content': {
        fontWeight: theme.typography.fontWeightBold,
      },
    },
  },
  alert: {
    '&> .MuiAlert-message': {
      maxWidth: '100%',
      overflow: 'auto',
    },
  },
}));

export interface OutputItem {
  id: string;
  level: 'Error' | 'Info' | 'Debug';
  message: string;
  details?: string[] | object;
}

interface OutputPanelProps {
  items: OutputItem[];
}

const OutputPanel: React.FC<OutputPanelProps> = ({ items }) => {
  const classes = useStyles();

  return (
    <Box>
      <Typography variant="h5">Output</Typography>
      <Box>
        {items.length === 0 ? (
          <Typography variant="subtitle1">
            Guardoni output will appear here
          </Typography>
        ) : (
          items.reverse().map((item) => (
            <Box
              key={item.id}
              style={{
                marginBottom: 20,
              }}
            >
              <Alert
                className={classes.alert}
                severity={alertSeverity(item.level)}
                variant="outlined"
                elevation={0}
              >
                <AlertTitle>{item.message}</AlertTitle>
                {item.details === undefined ? null : (
                  <Accordion
                    className={classes.accordion}
                    variant="elevation"
                    elevation={0}
                    style={{ margin: 0, padding: 0, overflow: 'auto' }}
                  >
                    <AccordionSummary>Details</AccordionSummary>

                    {Array.isArray(item.details) ? (
                      <AccordionDetails style={{ display: 'block' }}>
                        {item.details.map((detail) => (
                          <Typography
                            key={uuid()}
                            display="block"
                            style={{ marginBottom: 20 }}
                          >
                            {detail}
                          </Typography>
                        ))}
                      </AccordionDetails>
                    ) : (
                      <AccordionDetails>
                        <pre style={{ maxWidth: '100%' }}>
                          {JSON.stringify(item.details, null, 2)}
                        </pre>
                      </AccordionDetails>
                    )}
                  </Accordion>
                )}
              </Alert>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default OutputPanel;
