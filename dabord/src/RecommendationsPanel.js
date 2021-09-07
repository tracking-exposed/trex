import React from "react";

import Recommendations from "./Recommendations";
import Fetcher from "./Fetcher";
import { CreatorVideos } from "./components/CreatorVideos";
import { CurrentVideoOnEdit } from "./components/CurrentVideoOnEdit";
import { Grid } from "@material-ui/core";

class RecommendationsPanel extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { url: "https://" };
  }

  handleChange = (e) => {
    // this handle the pressing of "Enter" key
    console.log(e.keyCode);
    console.log("Currently", e.target.value, this.state.url);
    if (e.keyCode === 13) {
      console.log("New value recorded", e.target.value);
    }
    this.setState({ url: e.target.value });
  };

  render() {
    return (
      <Grid container spacing={3}>
        <Grid item md={4}>
          <h4>Your videos:</h4>
          <CreatorVideos />
        </Grid>
        <Grid item md={4}>
          <Fetcher />
          <Recommendations />
        </Grid>
        <Grid item md={4}>
          <CurrentVideoOnEdit />
        </Grid>
      </Grid>
    );
  }
}

export default RecommendationsPanel;
