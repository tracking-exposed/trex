import { Card, Grid } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import * as React from "react";

export const ErrorBox = (e) => {
  return (
    <Grid item>
      <Card>
        <Alert severity="error">
          <AlertTitle>Error {e.name}</AlertTitle>
          {e.message}

          <div>
            <code>{JSON.stringify(e, null, 2)}</code>
          </div>
        </Alert>
      </Card>
    </Grid>
  );
};
