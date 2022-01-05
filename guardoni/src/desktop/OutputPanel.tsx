import { Box, Typography } from '@material-ui/core';
import * as React from 'react';
import { v4 as uuid } from 'uuid';

export interface OutputItem {
  id: string;
  level: 'Error' | 'Info';
  message: string;
  details?: string[];
}

interface OutputPanelProps {
  items: OutputItem[];
}

const OutputPanel: React.FC<OutputPanelProps> = ({ items }) => {
  return (
    <Box>
      <Typography variant="h5">Output</Typography>
      <Box>
        {items.map((item) => (
          <Box
            key={item.id}
            style={{
              marginBottom: 20,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                color={item.level === 'Error' ? 'error' : 'inherit'}
                style={{
                  fontWeight: 600,
                }}
                display="inline"
              >
                {item.level}
              </Typography>
              :{' '}
              <Typography
                display="inline"
                variant="subtitle1"
                color={item.level === 'Error' ? 'error' : 'inherit'}
              >
                {item.message}
              </Typography>
            </Box>

            {item.details ? (
              <Box>
                {item.details.map((detail) => (
                  <Typography key={uuid()}>{detail}</Typography>
                ))}
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default OutputPanel;
