<<<<<<< HEAD
import React from 'react';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';
import {addRecommendation} from './API/commands'

=======
import React from "react";
import TextField from "@material-ui/core/TextField";
import Chip from "@material-ui/core/Chip";
import { addRecommendation } from "./API/commands";
>>>>>>> use avenger to handle api communication

const styles = {
  width: "100%",
  textAlign: "left",
};

class Fetcher extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { url: "https://" };
    this.completed = this.completed.bind(this);
  }

  completed(e) {
    const url = document.querySelector('[placeholder="Placeholder"]').value;
    console.log("fetching ...", url);
    addRecommendation(encodeURIComponent(url), { paging: true })();
  }

  render() {
    return (
      <div style={styles}>
        <TextField
          label="Recommendation URL"
          placeholder="Placeholder"
          multiline
        />
        <Chip color="secondary"
          onClick={this.completed}
         label="Add" />
      </div>
    );
  }
}

          // { this.state.newurl1 ?  <UrlCard data={this.state.lastFetch} /> : "" }
export default Fetcher;
