import { Card } from "@material-ui/core";
import * as QR from "avenger/lib/QueryResult";
import { WithQueries } from "avenger/lib/react";
import React from "react";
import * as queries from "./API/queries";
import { ErrorBox } from "./components/common/ErrorBox";
import { LazyFullSizeLoader } from "./components/common/FullSizeLoader";
import UrlCard from "./UrlCard";

const styles = {
  /* width: '400px', */
  textAlign: "left",
};

class Recommendations extends React.PureComponent {
  render() {
    return (
      <span>
        <div style={styles}>
          <h4>Your recommendations</h4>
        </div>
        <div className="card-group">
          <WithQueries
            queries={{
              recommendations: queries.recommendations,
            }}
            params={{ recommendations: { paging: true } }}
            render={QR.fold(
              LazyFullSizeLoader,
              ErrorBox,
              ({ recommendations }) => {
                console.log(recommendations.length);
                console.log(recommendations);
                if (recommendations.length === 0) {
                  return (
                    <div style={styles}>
                      <Card>
                        <h1>
                          Altought connection with server worked, no content was
                          available:{" "}
                          <a href="https://www.youtube.com/watch?v=bs2u4NLaxbI">
                            ODD?
                          </a>
                          .
                        </h1>
                      </Card>
                    </div>
                  );
                }
                return recommendations.map((item, i) => (
                  <UrlCard key={i} data={item} />
                ));
              }
            )}
          />
        </div>
      </span>
    );
  }
}

export default Recommendations;
