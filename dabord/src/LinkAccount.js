import React from "react";
import InputLabel from "@material-ui/core/InputLabel";
import TextField from "@material-ui/core/TextField";
import UrlCard from "./UrlCard";
import { setCreatorChannel } from "./API/commands";
import { WithQueries } from "avenger/lib/react";
import * as QR from "avenger/lib/QueryResult";
import { LazyFullSizeLoader } from "./components/common/FullSizeLoader";
import { ErrorBox } from "./components/common/ErrorBox";
import * as queries from "./API/queries";

const styles = {
  width: "100%",
  textAlign: "center",
};

const prestyle = {
  backgroundColor: "#f4f7da",
  textAlign: "left",
};

class LinkAccount extends React.Component {
  state = { url: undefined };

  handleChange = (e) => {
    this.setState({ url: e.target.value });
  };

  completed = (e) => {
    // this handle the pressing of "Enter" key
    if (e.keyCode === 13) {
      setCreatorChannel(e.target.value)();
    }
  };

  render() {
    return (
      <WithQueries
        queries={{
          creatorChannel: queries.creatorChannel,
        }}
        params={{}}
        render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ creatorChannel }) => {
          return (
            <div style={styles}>
              <InputLabel>
                Your Channel name or a Video of yours then <kbd>Enter</kbd>
              </InputLabel>
              <TextField
                fullWidth={true}
                value={this.state.url ?? creatorChannel.publicKey ?? ""}
                onChange={this.handleChange}
                onKeyDown={this.completed}
              />
              <code>State dump</code>
              <pre style={prestyle}>{JSON.stringify(this.state)}</pre>
              <pre style={prestyle}>{JSON.stringify(this.props)}</pre>
              <UrlCard
                key={this.state.urlnumber}
                fetch={true}
                url={this.state.url}
                data={{ id: "", videoId: "" }}
              />
            </div>
          );
        })}
      />
    );
  }
}

export default LinkAccount;
