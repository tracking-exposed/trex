import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  Grid,
}from '@material-ui/core';

export interface InjectedVideoCardProps {
  url: string;
  title: string;
  image: string;
}

export const InjectedVideoCard: React.FC<InjectedVideoCardProps> = ({
  image,
  url,
  title,
}) => (
  <Card>
    <Grid container>
      <Grid item xs={4}>
        <CardContent>
          <a href={url}>
            <img
              alt={title}
              src={image}
              style={{
                maxWidth: '100%',
              }}
            />
          </a>
        </CardContent>
      </Grid>
      <Grid item xs={8}>
        <CardHeader title={title} />
      </Grid>
    </Grid>
  </Card>
);
