import React from "react";

import Recommendations from "./Recommendations";
import Fetcher from "./Fetcher";

const columnstyles = {
  width: "33%",
  float: "left",
  textAlign: "center",
};

class RecommendationsPanel extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { url: "https://" };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    // this handle the pressing of "Enter" key
    console.log(e.keyCode);
    console.log("Currently", e.target.value, this.state.url);
    if (e.keyCode === 13) {
      console.log("New value recorded", e.target.value);
    }
    this.setState({ url: e.target.value });
  }

  // <Input value={this.state.value} onKeyDown={this.keyPress} onChange={this.handleChange} fullWidth={true} />
  render() {
    return (
      <div>
        <div style={columnstyles}>
          <h4>Your videos:</h4>
        </div>
        <div style={columnstyles}>
          <Fetcher />
          <Recommendations />
        </div>
        <div style={columnstyles}>
          <h3>1. select one of your videos </h3>
          <h3>2. drag recommendations in place</h3>
        </div>
      </div>
    );
  }
}

export default RecommendationsPanel;
