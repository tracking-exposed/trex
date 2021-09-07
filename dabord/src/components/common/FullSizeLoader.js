import CircularProgress from "@material-ui/core/CircularProgress";
import * as React from "react";

export const FullSizeLoader = () => {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        textAlign: "center",
        minHeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </div>
  );
};

export const LazyFullSizeLoader = () => <FullSizeLoader />;
